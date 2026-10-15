import type { EventoCorrida } from "../../contracts/event-envelope.js";
import type { CorridaProjection, EventoAuditRepository } from "./projection-ports.js";

export class ProcessarEventoCorridaUseCase {
  constructor(
    private readonly auditoria: EventoAuditRepository,
    private readonly projecao: CorridaProjection,
  ) {}

  async execute(evento: EventoCorrida): Promise<void> {
    await this.auditoria.registrar(evento);
    // Rodar a projeção mesmo quando o evento já foi auditado repara falhas parciais anteriores.
    await this.projecao.atualizar(evento);
  }
}
