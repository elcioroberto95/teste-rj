import { describe, expect, it, jest } from "@jest/globals";
import { ProcessarEventoCorridaUseCase } from "../../../src/worker/projection/application/processar-evento-corrida.use-case.js";
import type { CorridaProjection, EventoAuditRepository } from "../../../src/worker/projection/application/projection-ports.js";
import type { EventoCorrida } from "../../../src/worker/contracts/event-envelope.js";

const evento: EventoCorrida = {
  event_id: "event-1",
  event_type: "corrida.status_alterado",
  schema_version: 1,
  occurred_at: "2026-10-14T12:00:00.000Z",
  correlation_id: "correlation-1",
  corrida_id: "ride-1",
  aggregate_version: 2,
  payload: {
    id: "ride-1",
    passageiroId: "passenger-1",
    motoristaId: "driver-1",
    origem: "Centro",
    destino: "Aeroporto",
    status: "ACEITA",
    versao: 2,
    criadaEm: "2026-10-14T12:00:00.000Z",
  },
};

describe("ProcessarEventoCorridaUseCase", () => {
  it("executa auditoria antes da projeção", async () => {
    const chamadas: string[] = [];
    const auditoria: EventoAuditRepository = {
      registrar: jest.fn<EventoAuditRepository["registrar"]>().mockImplementation(async () => {
        chamadas.push("auditoria");
      }),
    };
    const projecao: CorridaProjection = {
      atualizar: jest.fn<CorridaProjection["atualizar"]>().mockImplementation(async () => {
        chamadas.push("projecao");
      }),
    };
    const useCase = new ProcessarEventoCorridaUseCase(auditoria, projecao);

    await useCase.execute(evento);

    expect(chamadas).toEqual(["auditoria", "projecao"]);
  });

  it("sempre chama a projeção depois que a auditoria idempotente retorna", async () => {
    const auditoria: EventoAuditRepository = {
      registrar: jest.fn<EventoAuditRepository["registrar"]>().mockResolvedValue(undefined),
    };
    const atualizar = jest.fn<CorridaProjection["atualizar"]>().mockResolvedValue(undefined);
    const useCase = new ProcessarEventoCorridaUseCase(auditoria, { atualizar });

    await useCase.execute(evento);

    expect(atualizar).toHaveBeenCalledWith(evento);
  });

  it("não atualiza a projeção quando a auditoria falha", async () => {
    const auditoria: EventoAuditRepository = {
      registrar: jest.fn<EventoAuditRepository["registrar"]>().mockRejectedValue(new Error("mongo")),
    };
    const atualizar = jest.fn<CorridaProjection["atualizar"]>().mockResolvedValue(undefined);
    const useCase = new ProcessarEventoCorridaUseCase(auditoria, { atualizar });

    await expect(useCase.execute(evento)).rejects.toThrow("mongo");
    expect(atualizar).not.toHaveBeenCalled();
  });
});
