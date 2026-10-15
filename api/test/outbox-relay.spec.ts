import { describe, expect, it, jest } from "@jest/globals";
import { OutboxRelay } from "../src/worker/outbox-relay.js";
import type { ConfirmPublisher } from "../src/worker/confirm-publisher.js";
import type { OutboxRepository, OutboxRecord } from "../src/worker/outbox.repository.js";

const evento: OutboxRecord = {
  id: "event-1",
  tipo: "corrida.criada",
  versaoSchema: 1,
  ocorridoEm: new Date("2026-10-14T12:00:00.000Z"),
  correlationId: "correlation-1",
  corridaId: "ride-1",
  versaoAgregado: 1,
  payload: {
    id: "ride-1",
    passageiroId: "passenger-1",
    motoristaId: null,
    origem: "Centro",
    destino: "Aeroporto",
    status: "SOLICITADA",
    versao: 1,
    criadaEm: "2026-10-14T12:00:00.000Z",
  },
};

describe("OutboxRelay", () => {
  it("marca o evento somente depois do publisher confirm", async () => {
    const ordem: string[] = [];
    const repository: OutboxRepository = {
      buscarPendentes: jest.fn<OutboxRepository["buscarPendentes"]>().mockResolvedValue([evento]),
      marcarPublicado: jest.fn<OutboxRepository["marcarPublicado"]>().mockImplementation(async () => {
        ordem.push("marcado");
      }),
    };
    const publisher: ConfirmPublisher = {
      publish: jest.fn<ConfirmPublisher["publish"]>().mockReturnValue(true),
      waitForConfirms: jest.fn<ConfirmPublisher["waitForConfirms"]>().mockImplementation(async () => {
        ordem.push("confirmado");
      }),
    };
    const relay = new OutboxRelay(repository, publisher);

    await expect(relay.runOnce()).resolves.toBe(1);

    expect(ordem).toEqual(["confirmado", "marcado"]);
    expect(publisher.publish).toHaveBeenCalledWith(
      "corridas",
      "corrida.criada",
      expect.any(Buffer),
      expect.objectContaining({ persistent: true, messageId: "event-1" }),
    );
  });

  it("não marca quando o broker não confirma publicação", async () => {
    const repository: OutboxRepository = {
      buscarPendentes: jest.fn<OutboxRepository["buscarPendentes"]>().mockResolvedValue([evento]),
      marcarPublicado: jest.fn<OutboxRepository["marcarPublicado"]>().mockResolvedValue(undefined),
    };
    const publisher: ConfirmPublisher = {
      publish: jest.fn<ConfirmPublisher["publish"]>().mockReturnValue(true),
      waitForConfirms: jest.fn<ConfirmPublisher["waitForConfirms"]>().mockRejectedValue(new Error("broker")),
    };
    const relay = new OutboxRelay(repository, publisher);

    await expect(relay.runOnce()).rejects.toThrow("broker");
    expect(repository.marcarPublicado).not.toHaveBeenCalled();
  });
});
