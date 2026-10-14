import type { Collection, Db } from "mongodb";
import type { RedisClientType } from "redis";
import type { ConfirmPublisher } from "./outbox-relay.js";
import { validarEvento } from "./event-envelope.js";

const UPDATE_IF_NEWER = `
local current = redis.call('GET', KEYS[1])
if not current then
  redis.call('SET', KEYS[1], ARGV[1]); return 1
end
local ok, decoded = pcall(cjson.decode, current)
if not ok or not decoded.versao then redis.call('SET', KEYS[1], ARGV[1]); return 1 end
local currentVersion = tonumber(decoded.versao)
local newVersion = tonumber(cjson.decode(ARGV[1]).versao)
if newVersion > currentVersion then redis.call('SET', KEYS[1], ARGV[1]); return 1 end
return 0
`;

export class ProjectionConsumer {
  private readonly audit: Collection;

  constructor(private readonly db: Db, private readonly redis: RedisClientType, private readonly publisher: ConfirmPublisher) {
    this.audit = db.collection("eventos_corrida");
  }

  async initialize(): Promise<void> {
    await this.audit.createIndex({ event_id: 1 }, { unique: true });
  }

  async apply(raw: Buffer): Promise<void> {
    const event = validarEvento(JSON.parse(raw.toString("utf8")));
    try {
      await this.audit.updateOne(
        { event_id: event.event_id },
        { $setOnInsert: { ...event, processado_em: new Date() } },
        { upsert: true },
      );
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
    }
    // Sempre tenta Redis: Mongo pode ter sido gravado antes de uma falha parcial.
    await this.redis.eval(UPDATE_IF_NEWER, {
      keys: [`corrida:${event.corrida_id}`],
      arguments: [JSON.stringify(event.payload)],
    });
  }

  async retryOrDeadLetter(content: Buffer, headers: Record<string, unknown> = {}): Promise<void> {
    const attempts = Number(headers["x-retry-count"] ?? 0);
    if (attempts >= 3) {
      this.publisher.publish("corridas.dlx", "corridas.dead", content, {
        persistent: true, contentType: "application/json", headers: { ...headers, "x-retry-count": attempts },
      });
    } else {
      this.publisher.publish("corridas.retry", "corridas.retry", content, {
        persistent: true,
        expiration: "5000",
        contentType: "application/json",
        headers: { ...headers, "x-retry-count": attempts + 1 },
      });
    }
    await this.publisher.waitForConfirms();
  }
}

export async function configurarTopologia(channel: {
  assertExchange(name: string, type: string, options: object): Promise<unknown>;
  assertQueue(name: string, options: object): Promise<unknown>;
  bindQueue(queue: string, exchange: string, pattern: string): Promise<unknown>;
}): Promise<void> {
  await channel.assertExchange("corridas", "topic", { durable: true });
  await channel.assertExchange("corridas.retry", "direct", { durable: true });
  await channel.assertExchange("corridas.dlx", "direct", { durable: true });
  await channel.assertQueue("corridas.projecoes", { durable: true });
  await channel.assertQueue("corridas.retry.5s", {
    durable: true, arguments: { "x-dead-letter-exchange": "corridas", "x-dead-letter-routing-key": "corrida.retry" },
  });
  await channel.assertQueue("corridas.dlq", { durable: true });
  await channel.bindQueue("corridas.projecoes", "corridas", "corrida.criada");
  await channel.bindQueue("corridas.projecoes", "corridas", "corrida.status_alterado");
  await channel.bindQueue("corridas.projecoes", "corridas", "corrida.retry");
  await channel.bindQueue("corridas.retry.5s", "corridas.retry", "corridas.retry");
  await channel.bindQueue("corridas.dlq", "corridas.dlx", "corridas.dead");
}
