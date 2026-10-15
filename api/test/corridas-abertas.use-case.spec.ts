import { describe, expect, it, jest } from "@jest/globals";
import { ListarCorridasAbertasUseCase } from "../src/corridas/application/listar-corridas-abertas.use-case.js";
import type { CorridaQueryRepository } from "../src/corridas/application/corrida.repository.js";

describe("ListarCorridasAbertasUseCase", () => {
  it("retorna corridas abertas e limita a consulta a no máximo 100", async () => {
    const listarAbertas = jest.fn<CorridaQueryRepository["listarAbertas"]>().mockResolvedValue([]);
    const repository = { listarAbertas } as CorridaQueryRepository;
    const useCase = new ListarCorridasAbertasUseCase(repository);

    await useCase.execute(500);

    expect(listarAbertas).toHaveBeenCalledWith(100);
  });

  it("usa o limite padrão de 50", async () => {
    const listarAbertas = jest.fn<CorridaQueryRepository["listarAbertas"]>().mockResolvedValue([]);
    const repository = { listarAbertas } as CorridaQueryRepository;
    const useCase = new ListarCorridasAbertasUseCase(repository);

    await useCase.execute();

    expect(listarAbertas).toHaveBeenCalledWith(50);
  });
});
