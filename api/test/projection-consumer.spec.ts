import { describe, expect, it, jest } from "@jest/globals";
import type { ConfirmChannel, ConsumeMessage } from "amqplib";
import { ProjectionConsumer } from "../src/worker/projection-consumer.js";
import type { ProcessarEventoCorridaUseCase } from "../src/worker/processar-evento-corrida.use-case.js";
import type { RetryPublisher } from "../src/worker/projection-ports.js";

function criarMensagem(): ConsumeMessage {
  return {
    content: Buffer.from(JSON.stringify({
      event_id: "event-1",
      event_type: "corrida.criada",
      schema_version: 1,
      occurred_at: "2026-10-14T12:00:00.000Z",
      correlation_id: "correlation-1",
      corrida_id: "ride-1",
      aggregate_version: 1,
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
    })),
    fields: {} as ConsumeMessage["fields"],
    properties: { headers: { "x-retry-count": 1 } } as ConsumeMessage["properties"],
  };
}

describe("ProjectionConsumer", () => {
  it("ack depois do processamento confirmado", async () => {
    const processar = { execute: jest.fn<ProcessarEventoCorridaUseCase["execute"]>().mockResolvedValue(undefined) };
    const retry = { encaminhar: jest.fn<RetryPublisher["encaminhar"]>().mockResolvedValue(undefined) };
    const channel = { ack: jest.fn(), nack: jest.fn() } as unknown as ConfirmChannel;
    const consumer = new ProjectionConsumer(processar as ProcessarEventoCorridaUseCase, retry, channel);
    const message = criarMensagem();

    await consumer.handle(message);

    expect(processar.execute).toHaveBeenCalledTimes(1);
    expect(channel.ack).toHaveBeenCalledWith(message);
    expect(retry.encaminhar).not.toHaveBeenCalled();
  });

  it("só ack após publicação confirmada no retry", async () => {
    const processar = { execute: jest.fn<ProcessarEventoCorridaUseCase["execute"]>().mockRejectedValue(new Error("redis")) };
    const retry = { encaminhar: jest.fn<RetryPublisher["encaminhar"]>().mockResolvedValue(undefined) };
    const channel = { ack: jest.fn(), nack: jest.fn() } as unknown as ConfirmChannel;
    const consumer = new ProjectionConsumer(processar as ProcessarEventoCorridaUseCase, retry, channel);
    const message = criarMensagem();

    await consumer.handle(message);

    expect(retry.encaminhar).toHaveBeenCalledWith(message.content, message.properties.headers);
    expect(channel.ack).toHaveBeenCalledWith(message);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it("requeue a mensagem original se a publicação do retry falhar", async () => {
    const processar = { execute: jest.fn<ProcessarEventoCorridaUseCase["execute"]>().mockRejectedValue(new Error("mongo")) };
    const retry = { encaminhar: jest.fn<RetryPublisher["encaminhar"]>().mockRejectedValue(new Error("rabbit")) };
    const channel = { ack: jest.fn(), nack: jest.fn() } as unknown as ConfirmChannel;
    const consumer = new ProjectionConsumer(processar as ProcessarEventoCorridaUseCase, retry, channel);
    const message = criarMensagem();

    await consumer.handle(message);

    expect(channel.nack).toHaveBeenCalledWith(message, false, true);
    expect(channel.ack).not.toHaveBeenCalled();
  });
});
