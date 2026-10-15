import type { EventoCorrida } from "./event-envelope.js";

export interface EventoAuditRepository {
  registrar(evento: EventoCorrida): Promise<void>;
}

export interface CorridaProjection {
  atualizar(evento: EventoCorrida): Promise<void>;
}

export interface RetryPublisher {
  encaminhar(content: Buffer, headers?: Record<string, unknown>): Promise<void>;
}
