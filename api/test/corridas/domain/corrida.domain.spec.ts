import { describe, expect, it } from "@jest/globals";
import {
  criarCorrida,
  transicionarCorrida,
  proximoStatusCorrida,
  CorridaInvalidaError,
  MotoristaNaoResponsavelError,
  TransicaoCorridaInvalidaError,
} from "../../../src/corridas/domain/corrida.js";

describe("Corrida", () => {
  const criadaEm = new Date("2026-10-14T12:00:00.000Z");

  function novaCorrida() {
    return criarCorrida({
      id: "corrida-1",
      passageiroId: "passageiro-1",
      origem: "  Centro  ",
      destino: "  Aeroporto  ",
      criadaEm,
    });
  }

  it("cria no estado inicial, normalizando os endereços", () => {
    expect(novaCorrida()).toEqual({
      id: "corrida-1",
      passageiroId: "passageiro-1",
      origem: "Centro",
      destino: "Aeroporto",
      criadaEm,
      motoristaId: null,
      status: "SOLICITADA",
      versao: 1,
    });
  });

  it("percorre o fluxo permitido sem trocar o identificador e incrementa a versão", () => {
    const aceita = transicionarCorrida(novaCorrida(), "ACEITA", "motorista-1");
    const iniciada = transicionarCorrida(aceita, "EM_ANDAMENTO", "motorista-1");
    const finalizada = transicionarCorrida(iniciada, "FINALIZADA", "motorista-1");

    expect([aceita.status, iniciada.status, finalizada.status]).toEqual([
      "ACEITA", "EM_ANDAMENTO", "FINALIZADA",
    ]);
    expect([aceita.versao, iniciada.versao, finalizada.versao]).toEqual([2, 3, 4]);
    expect(finalizada.id).toBe("corrida-1");
    expect(finalizada.motoristaId).toBe("motorista-1");
  });

  it("expõe a próxima transição a partir da mesma regra usada pelo domínio", () => {
    expect(proximoStatusCorrida("SOLICITADA")).toBe("ACEITA");
    expect(proximoStatusCorrida("ACEITA")).toBe("EM_ANDAMENTO");
    expect(proximoStatusCorrida("EM_ANDAMENTO")).toBe("FINALIZADA");
    expect(proximoStatusCorrida("FINALIZADA")).toBeNull();
  });

  it("permite somente a próxima transição declarada para cada estado", () => {
    const solicitada = novaCorrida();
    const aceita = transicionarCorrida(solicitada, "ACEITA", "motorista-1");
    const emAndamento = transicionarCorrida(aceita, "EM_ANDAMENTO", "motorista-1");
    const finalizada = transicionarCorrida(emAndamento, "FINALIZADA", "motorista-1");

    expect(() => transicionarCorrida(solicitada, "FINALIZADA", "motorista-1"))
      .toThrow(TransicaoCorridaInvalidaError);
    expect(() => transicionarCorrida(aceita, "FINALIZADA", "motorista-1"))
      .toThrow(TransicaoCorridaInvalidaError);
    expect(() => transicionarCorrida(finalizada, "FINALIZADA", "motorista-1"))
      .toThrow(TransicaoCorridaInvalidaError);
  });

  it("rejeita saltos, regressões e alterações depois da finalização", () => {
    expect(() => transicionarCorrida(novaCorrida(), "EM_ANDAMENTO", "motorista-1"))
      .toThrow(TransicaoCorridaInvalidaError);

    const aceita = transicionarCorrida(novaCorrida(), "ACEITA", "motorista-1");
    expect(() => transicionarCorrida(aceita, "SOLICITADA", "motorista-1"))
      .toThrow(TransicaoCorridaInvalidaError);

    const finalizada = transicionarCorrida(
      transicionarCorrida(
        transicionarCorrida(novaCorrida(), "ACEITA", "motorista-1"),
        "EM_ANDAMENTO",
        "motorista-1",
      ),
      "FINALIZADA",
      "motorista-1",
    );
    expect(() => transicionarCorrida(finalizada, "ACEITA", "motorista-1"))
      .toThrow(TransicaoCorridaInvalidaError);
  });

  it("mantém a corrida vinculada ao motorista que a aceitou", () => {
    const aceita = transicionarCorrida(novaCorrida(), "ACEITA", "motorista-1");
    expect(() => transicionarCorrida(aceita, "EM_ANDAMENTO", "motorista-2"))
      .toThrow(MotoristaNaoResponsavelError);
  });

  it("rejeita origem ou destino vazio e endereços longos demais", () => {
    expect(() => criarCorrida({
      id: "corrida-1", passageiroId: "passageiro-1", origem: "  ", destino: "Aeroporto", criadaEm,
    })).toThrow(CorridaInvalidaError);
    expect(() => criarCorrida({
      id: "corrida-1", passageiroId: "passageiro-1", origem: "Centro", destino: "x".repeat(501), criadaEm,
    })).toThrow(CorridaInvalidaError);
  });
});
