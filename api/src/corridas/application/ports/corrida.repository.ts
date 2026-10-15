import type { Corrida } from "../../domain/corrida.js";

export const CORRIDA_COMMAND_REPOSITORY = Symbol("CORRIDA_COMMAND_REPOSITORY");
export const CORRIDA_QUERY_REPOSITORY = Symbol("CORRIDA_QUERY_REPOSITORY");

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

export interface AlterarStatusCorridaInput {
  corridaId: string;
  motoristaId: string;
  novoStatus: Corrida["status"];
  correlationId: string;
}

export interface CorridaCommandRepository {
  criarComIdempotencia(input: CriarCorridaComIdempotencia): Promise<ResultadoCriacao>;
  alterarStatus(input: AlterarStatusCorridaInput): Promise<Corrida>;
}

export interface CorridaQueryRepository {
  buscarPorId(id: string): Promise<Corrida | null>;
  listarAbertas(limite: number): Promise<Corrida[]>;
}
