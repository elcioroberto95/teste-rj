import type { AlterarStatusCorridaInput, CorridaCommandRepository } from "../ports/corrida.repository.js";

export class AlterarStatusUseCase {
  constructor(private readonly repository: CorridaCommandRepository) {}

  execute(input: AlterarStatusCorridaInput) {
    return this.repository.alterarStatus(input);
  }
}
