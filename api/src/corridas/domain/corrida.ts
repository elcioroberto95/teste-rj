export const STATUS_CORRIDA = ["SOLICITADA", "ACEITA", "EM_ANDAMENTO", "FINALIZADA"] as const;
export type StatusCorrida = (typeof STATUS_CORRIDA)[number];

const TRANSICOES_PERMITIDAS: Readonly<Record<StatusCorrida, readonly StatusCorrida[]>> = {
  SOLICITADA: ["ACEITA"],
  ACEITA: ["EM_ANDAMENTO"],
  EM_ANDAMENTO: ["FINALIZADA"],
  FINALIZADA: [],
};

export function proximoStatusCorrida(status: StatusCorrida): StatusCorrida | null {
  return TRANSICOES_PERMITIDAS[status][0] ?? null;
}

export function isStatusCorrida(value: unknown): value is StatusCorrida {
  return typeof value === "string" && STATUS_CORRIDA.some((status) => status === value);
}

export interface Corrida {
  id: string;
  passageiroId: string;
  motoristaId: string | null;
  origem: string;
  destino: string;
  status: StatusCorrida;
  versao: number;
  criadaEm: Date;
}

export interface NovaCorrida {
  id: string;
  passageiroId: string;
  origem: string;
  destino: string;
  criadaEm: Date;
}

export class CorridaInvalidaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CorridaInvalidaError";
  }
}

export class CorridaNaoEncontradaError extends Error {
  constructor() {
    super("Corrida não encontrada");
    this.name = "CorridaNaoEncontradaError";
  }
}

export class AcessoCorridaNegadoError extends Error {
  constructor() {
    super("Usuário não tem acesso a esta corrida");
    this.name = "AcessoCorridaNegadoError";
  }
}

export class TransicaoCorridaInvalidaError extends Error {
  constructor() {
    super("Transição de status inválida para a corrida");
    this.name = "TransicaoCorridaInvalidaError";
  }
}

export class MotoristaNaoResponsavelError extends Error {
  constructor() {
    super("A corrida já está associada a outro motorista");
    this.name = "MotoristaNaoResponsavelError";
  }
}

export class ConflitoVersaoCorridaError extends Error {
  constructor() {
    super("A corrida foi alterada por outra requisição; consulte o estado atual");
    this.name = "ConflitoVersaoCorridaError";
  }
}

export function criarCorrida(input: NovaCorrida): Corrida {
  const origem = input.origem.trim();
  const destino = input.destino.trim();
  if (!origem || !destino) throw new CorridaInvalidaError("Origem e destino são obrigatórios");
  if (origem.length > 500 || destino.length > 500) {
    throw new CorridaInvalidaError("Origem e destino devem ter até 500 caracteres");
  }
  return {
    ...input,
    origem,
    destino,
    motoristaId: null,
    status: "SOLICITADA",
    versao: 1,
  };
}

export function transicionarCorrida(
  corrida: Corrida,
  novoStatus: StatusCorrida,
  motoristaId: string,
): Corrida {
  if (!TRANSICOES_PERMITIDAS[corrida.status].includes(novoStatus)) {
    throw new TransicaoCorridaInvalidaError();
  }
  if (corrida.motoristaId && corrida.motoristaId !== motoristaId) {
    throw new MotoristaNaoResponsavelError();
  }
  return {
    ...corrida,
    motoristaId: corrida.motoristaId ?? motoristaId,
    status: novoStatus,
    versao: corrida.versao + 1,
  };
}
