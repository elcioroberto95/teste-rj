export const OUTBOX_REPOSITORY = Symbol("OUTBOX_REPOSITORY");

export interface OutboxRecord {
  id: string;
  tipo: string;
  versaoSchema: number;
  ocorridoEm: Date;
  correlationId: string;
  traceparent?: string | null;
  corridaId: string;
  versaoAgregado: number;
  payload: unknown;
}

export interface OutboxRepository {
  buscarPendentes(limite: number): Promise<OutboxRecord[]>;
  marcarPublicado(id: string, publicadoEm: Date): Promise<void>;
}
