import type { AlterarStatusCorridaInput, CorridaCommandRepository } from "./corrida.repository.js";

export class AlterarStatusUseCase {
  constructor(private readonly repository: CorridaCommandRepository) {}

  execute(input: AlterarStatusCorridaInput) {
    return this.repository.alterarStatus(input);
  }
}
