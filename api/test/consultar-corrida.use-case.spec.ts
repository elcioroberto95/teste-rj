import { describe, expect, it, jest } from "@jest/globals";
import { ConsultarCorridaUseCase, type PoliticaConsultaCorrida } from "../src/corridas/application/consultar-corrida.use-case.js";
import type { Corrida } from "../src/corridas/domain/corrida.js";

describe("ConsultarCorridaUseCase", () => {
  it("delegates each profile to its registered policy", async () => {
    const corrida = { id: "ride-1" } as Corrida;
    const passageiro = { execute: jest.fn<PoliticaConsultaCorrida["execute"]>().mockResolvedValue(corrida) };
    const motorista = { execute: jest.fn<PoliticaConsultaCorrida["execute"]>().mockResolvedValue(corrida) };
    const useCase = new ConsultarCorridaUseCase({ passageiro, motorista });

    await expect(useCase.execute("ride-1", "user-1", "passageiro")).resolves.toBe(corrida);
    await expect(useCase.execute("ride-1", "user-2", "motorista")).resolves.toBe(corrida);

    expect(passageiro.execute).toHaveBeenCalledWith("ride-1", "user-1");
    expect(motorista.execute).toHaveBeenCalledWith("ride-1", "user-2");
  });
});
