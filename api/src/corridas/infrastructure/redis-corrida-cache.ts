import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { createClient, type RedisClientType } from "redis";
import type { CorridaCache } from "../application/ports/corrida-cache.js";
import type { Corrida } from "../domain/corrida.js";
import { isStatusCorrida } from "../domain/corrida.js";

const UPDATE_IF_NEWER = `
local current = redis.call('GET', KEYS[1])
if not current then redis.call('SET', KEYS[1], ARGV[1]); return 1 end
local ok, decoded = pcall(cjson.decode, current)
if not ok or not decoded.versao then redis.call('SET', KEYS[1], ARGV[1]); return 1 end
local currentVersion = tonumber(decoded.versao)
local newVersion = tonumber(cjson.decode(ARGV[1]).versao)
if newVersion > currentVersion then redis.call('SET', KEYS[1], ARGV[1]); return 1 end
return 0
`;

function parseCorrida(value: string): Corrida | null {
  try {
    const parsed = JSON.parse(value) as Partial<Corrida>;
    if (
      typeof parsed.id !== "string" || typeof parsed.passageiroId !== "string" ||
      typeof parsed.origem !== "string" || typeof parsed.destino !== "string" ||
      typeof parsed.versao !== "number" ||
      !isStatusCorrida(parsed.status) ||
      !(parsed.motoristaId === null || typeof parsed.motoristaId === "string") ||
      typeof parsed.criadaEm !== "string" && !(parsed.criadaEm instanceof Date)
    ) return null;
    const criadaEm = new Date(parsed.criadaEm);
    if (Number.isNaN(criadaEm.getTime())) return null;
    return { ...parsed, criadaEm } as Corrida;
  } catch {
    return null;
  }
}

@Injectable()
export class RedisCorridaCache implements CorridaCache, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCorridaCache.name);
  private readonly client: RedisClientType;

  constructor() {
    this.client = createClient({ url: process.env.REDIS_URL });
    this.client.on("error", (error) => this.logger.warn(`Redis indisponível: ${error.message}`));
  }

  async onModuleInit(): Promise<void> {
    void this.client.connect().catch((error: unknown) => {
      this.logger.warn(`Iniciando sem Redis; consultas usarão MySQL: ${String(error)}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) await this.client.quit();
  }

  async buscar(id: string): Promise<Corrida | null> {
    if (!this.client.isReady) return null;
    const value = await this.client.get(`corrida:${id}`);
    if (!value) return null;
    const corrida = parseCorrida(value);
    return corrida?.id === id ? corrida : null;
  }

  async salvarSeMaisNova(corrida: Corrida): Promise<void> {
    if (!this.client.isReady) return;
    await this.client.eval(UPDATE_IF_NEWER, {
      keys: [`corrida:${corrida.id}`],
      arguments: [JSON.stringify(corrida)],
    });
  }
}
