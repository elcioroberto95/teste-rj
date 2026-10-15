import type { Corrida } from "../../domain/corrida.js";

export const CORRIDA_CACHE = Symbol("CORRIDA_CACHE");

export interface CorridaCache {
  buscar(id: string): Promise<Corrida | null>;
  salvarSeMaisNova(corrida: Corrida): Promise<void>;
}
