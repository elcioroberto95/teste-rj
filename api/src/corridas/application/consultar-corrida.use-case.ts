import type { CorridaRepository } from "./corrida.repository.js";
import { CorridaNaoEncontradaError, AcessoCorridaNegadoError } from "../domain/corrida.js";

export class ConsultarCorridaUseCase {
  constructor(private readonly repository: CorridaRepository) {}

  async execute(corridaId: string, passageiroId: string) {
    const corrida = await this.repository.buscarPorId(corridaId);
    if (!corrida) throw new CorridaNaoEncontradaError();
    if (corrida.passageiroId !== passageiroId) throw new AcessoCorridaNegadoError();
    return corrida;
  }
}
