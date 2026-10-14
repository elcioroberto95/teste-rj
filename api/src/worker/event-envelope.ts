export interface EventoCorrida {
  event_id: string;
  event_type: "corrida.criada" | "corrida.status_alterado";
  schema_version: number;
  occurred_at: string;
  correlation_id: string;
  corrida_id: string;
  aggregate_version: number;
  payload: {
    id: string;
    passageiroId: string;
    motoristaId: string | null;
    origem: string;
    destino: string;
    status: "SOLICITADA" | "ACEITA" | "EM_ANDAMENTO" | "FINALIZADA";
    versao: number;
    criadaEm: string;
  };
}

export function validarEvento(value: unknown): EventoCorrida {
  if (!value || typeof value !== "object") throw new Error("Envelope de evento inválido");
  const event = value as Partial<EventoCorrida>;
  if (
    typeof event.event_id !== "string" ||
    (event.event_type !== "corrida.criada" && event.event_type !== "corrida.status_alterado") ||
    typeof event.schema_version !== "number" ||
    typeof event.occurred_at !== "string" ||
    typeof event.correlation_id !== "string" ||
    typeof event.corrida_id !== "string" ||
    typeof event.aggregate_version !== "number" ||
    !event.payload || typeof event.payload !== "object" ||
    event.payload.id !== event.corrida_id ||
    event.payload.versao !== event.aggregate_version
  ) throw new Error("Envelope de evento inválido");
  return event as EventoCorrida;
}
