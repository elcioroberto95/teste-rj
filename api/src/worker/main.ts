import "dotenv/config";
import amqp, { type ChannelModel, type ConfirmChannel } from "amqplib";
import { MongoClient } from "mongodb";
import { createClient } from "redis";
import { PrismaService } from "../shared/database/prisma.service.js";
import { ProjectionConsumer } from "./projection/transport/projection-consumer.js";
import { OutboxRelay } from "./outbox/application/outbox-relay.js";
import { PrismaOutboxRepository } from "./outbox/infrastructure/prisma-outbox.repository.js";
import { MongoEventoAuditRepository } from "./projection/infrastructure/mongo-event-audit.repository.js";
import { RedisCorridaProjection } from "./projection/infrastructure/redis-corrida.projection.js";
import { ProcessarEventoCorridaUseCase } from "./projection/application/processar-evento-corrida.use-case.js";
import { RabbitRetryPublisher } from "./projection/infrastructure/rabbit-retry.publisher.js";
import { configurarTopologia } from "./projection/infrastructure/rabbitmq-topology.js";

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main(): Promise<void> {
  const rabbitUrl = process.env.RABBITMQ_URL;
  const mongoUrl = process.env.MONGODB_URL;
  const redisUrl = process.env.REDIS_URL;
  if (!rabbitUrl || !mongoUrl || !redisUrl) throw new Error("Configure RABBITMQ_URL, MONGODB_URL e REDIS_URL");

  const prisma = new PrismaService();
  const mongo = new MongoClient(mongoUrl);
  const redis = createClient({ url: redisUrl });
  redis.on("error", (error) => console.error("Erro de conexão do Redis no worker", error));
  await Promise.all([prisma.$connect(), mongo.connect(), redis.connect()]);

  const audit = new MongoEventoAuditRepository(mongo.db());
  await audit.initialize();
  const projection = new RedisCorridaProjection(redis);
  const processarEvento = new ProcessarEventoCorridaUseCase(audit, projection);
  const outboxRepository = new PrismaOutboxRepository(prisma);

  let stopping = false;
  let currentRelay: OutboxRelay | undefined;
  let currentConnection: ChannelModel | undefined;
  const stop = () => {
    stopping = true;
    currentRelay?.stop();
    void currentConnection?.close().catch(() => undefined);
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  try {
    while (!stopping) {
      let connection: ChannelModel | undefined;
      let channel: ConfirmChannel | undefined;
      let relay: OutboxRelay | undefined;
      let relayTask: Promise<void> | undefined;

      try {
        connection = await amqp.connect(rabbitUrl);
        currentConnection = connection;
        connection.on("error", (error) => console.error("Erro de conexão do RabbitMQ no worker", error));
        channel = await connection.createConfirmChannel();
        channel.on("error", (error) => console.error("Erro no canal RabbitMQ do worker", error));
        await configurarTopologia(channel);

        const consumer = new ProjectionConsumer(processarEvento, new RabbitRetryPublisher(channel), channel);
        await channel.consume("corridas.projecoes", (message) => consumer.handle(message), { noAck: false });

        relay = new OutboxRelay(outboxRepository, channel);
        currentRelay = relay;
        relayTask = relay.start();

        await new Promise<void>((resolve) => {
          connection?.once("close", resolve);
          channel?.once("close", resolve);
        });
      } catch (error) {
        if (!stopping) console.error("Worker desconectado do RabbitMQ; tentando reconectar", error);
      } finally {
        relay?.stop();
        if (relayTask) await relayTask;
        currentRelay = undefined;
        currentConnection = undefined;
        await channel?.close().catch(() => undefined);
        await connection?.close().catch(() => undefined);
      }

      if (!stopping) await esperar(1000);
    }
  } finally {
    await Promise.all([prisma.$disconnect(), mongo.close(), redis.quit()]);
  }
}

main().catch((error: unknown) => {
  console.error("Worker não iniciou", error);
  process.exitCode = 1;
});
