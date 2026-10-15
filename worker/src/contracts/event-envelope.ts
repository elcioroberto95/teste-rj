import { isStatusCorrida, type StatusCorrida } from "../../../api/src/corridas/domain/corrida.js";

export interface EventoCorrida {
  event_id: string;
  event_type: "corrida.criada" | "corrida.status_alterado";
  schema_version: number;
  occurred_at: string;
  correlation_id: string;
  traceparent?: string;
  corrida_id: string;
  aggregate_version: number;
  payload: {
    id: string;
    passageiroId: string;
    motoristaId: string | null;
    origem: string;
    destino: string;
    status: StatusCorrida;
    versao: number;
    criadaEm: string;
  };
}

type Registro = Record<string, unknown>;

function isRegistro(value: unknown): value is Registro {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEventType(value: unknown): value is EventoCorrida["event_type"] {
  return value === "corrida.criada" || value === "corrida.status_alterado";
}

function validarPayload(value: unknown): EventoCorrida["payload"] | null {
  if (!isRegistro(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.passageiroId !== "string" ||
    !(value.motoristaId === null || typeof value.motoristaId === "string") ||
    typeof value.origem !== "string" ||
    typeof value.destino !== "string" ||
    !isStatusCorrida(value.status) ||
    typeof value.versao !== "number" ||
    typeof value.criadaEm !== "string"
  ) return null;

  return {
    id: value.id,
    passageiroId: value.passageiroId,
    motoristaId: value.motoristaId,
    origem: value.origem,
    destino: value.destino,
    status: value.status,
    versao: value.versao,
    criadaEm: value.criadaEm,
  };
}

export function validarEvento(value: unknown): EventoCorrida {
  if (!isRegistro(value)) throw new Error("Envelope de evento inválido");
  const payload = validarPayload(value.payload);
  if (
    typeof value.event_id !== "string" ||
    !isEventType(value.event_type) ||
    typeof value.schema_version !== "number" ||
    typeof value.occurred_at !== "string" ||
    typeof value.correlation_id !== "string" ||
    (value.traceparent !== undefined && typeof value.traceparent !== "string") ||
    typeof value.corrida_id !== "string" ||
    typeof value.aggregate_version !== "number" ||
    !payload ||
    payload.id !== value.corrida_id ||
    payload.versao !== value.aggregate_version
  ) throw new Error("Envelope de evento inválido");

  return {
    event_id: value.event_id,
    event_type: value.event_type,
    schema_version: value.schema_version,
    occurred_at: value.occurred_at,
    correlation_id: value.correlation_id,
    ...(typeof value.traceparent === "string" ? { traceparent: value.traceparent } : {}),
    corrida_id: value.corrida_id,
    aggregate_version: value.aggregate_version,
    payload,
  };
}
