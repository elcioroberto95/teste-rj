import type { CorridaRepository } from "./corrida.repository.js";
import type { StatusCorrida } from "../domain/corrida.js";

export class AlterarStatusUseCase {
  constructor(private readonly repository: CorridaRepository) {}

  execute(input: {
    corridaId: string;
    motoristaId: string;
    novoStatus: StatusCorrida;
    correlationId: string;
  }) {
    return this.repository.alterarStatus(input);
  }
}
