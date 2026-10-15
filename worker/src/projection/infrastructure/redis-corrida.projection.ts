import type { RedisClientType } from "redis";
import type { EventoCorrida } from "../../contracts/event-envelope.js";
import type { CorridaProjection } from "../application/projection-ports.js";

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

export class RedisCorridaProjection implements CorridaProjection {
  constructor(private readonly redis: RedisClientType) {}

  async atualizar(evento: EventoCorrida): Promise<void> {
    await this.redis.eval(UPDATE_IF_NEWER, {
      keys: [`corrida:${evento.corrida_id}`],
      arguments: [JSON.stringify(evento.payload)],
    });
  }
}
