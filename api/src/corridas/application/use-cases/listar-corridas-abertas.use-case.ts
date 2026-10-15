import type { CorridaQueryRepository } from "../ports/corrida.repository.js";

const LIMITE_MAXIMO = 100;

export class ListarCorridasAbertasUseCase {
  constructor(private readonly repository: CorridaQueryRepository) {}

  execute(limite = 50) {
    return this.repository.listarAbertas(Math.min(Math.max(limite, 1), LIMITE_MAXIMO));
  }
}
