import type { Corrida } from "../domain/corrida.js";

export const CORRIDA_REPOSITORY = Symbol("CORRIDA_REPOSITORY");

export interface CriarCorridaComIdempotencia {
  corrida: Corrida;
  chave: string;
  hashRequisicao: string;
  correlationId: string;
}

export interface ResultadoCriacao {
  corrida: Corrida;
  repetida: boolean;
}

export interface CorridaRepository {
  criarComIdempotencia(input: CriarCorridaComIdempotencia): Promise<ResultadoCriacao>;
  buscarPorId(id: string): Promise<Corrida | null>;
  alterarStatus(input: {
    corridaId: string;
    motoristaId: string;
    novoStatus: Corrida["status"];
    correlationId: string;
  }): Promise<Corrida>;
}
