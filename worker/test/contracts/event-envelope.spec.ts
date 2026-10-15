import { describe, expect, it } from "@jest/globals";
import { validarEvento } from "../../src/contracts/event-envelope.js";

const evento = {
  event_id: "evento-1",
  event_type: "corrida.criada",
  schema_version: 1,
  occurred_at: "2026-10-15T12:00:00.000Z",
  correlation_id: "correlacao-1",
  corrida_id: "corrida-1",
  aggregate_version: 1,
  payload: {
    id: "corrida-1",
    passageiroId: "passageiro-1",
    motoristaId: null,
    origem: "Centro",
    destino: "Aeroporto",
    status: "SOLICITADA",
    versao: 1,
    criadaEm: "2026-10-15T12:00:00.000Z",
  },
};

describe("validarEvento", () => {
  it("retorna um envelope com payload completo e válido", () => {
    expect(validarEvento(evento)).toEqual(evento);
  });

  it("rejeita payload incompleto ou com status desconhecido", () => {
    expect(() => validarEvento({ ...evento, payload: { id: "corrida-1" } })).toThrow(
      "Envelope de evento inválido",
    );
    expect(() => validarEvento({
      ...evento,
      payload: { ...evento.payload, status: "CANCELADA" },
    })).toThrow("Envelope de evento inválido");
  });

  it("rejeita envelope cuja versão não corresponde à corrida", () => {
    expect(() => validarEvento({ ...evento, aggregate_version: 2 })).toThrow(
      "Envelope de evento inválido",
    );
  });
});
