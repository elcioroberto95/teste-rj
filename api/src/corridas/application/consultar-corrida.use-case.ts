import type { CorridaRepository } from "./corrida.repository.js";
import type { CorridaCache } from "./corrida-cache.js";
import { CorridaNaoEncontradaError, AcessoCorridaNegadoError } from "../domain/corrida.js";

export class ConsultarCorridaUseCase {
  constructor(private readonly repository: CorridaRepository, private readonly cache: CorridaCache) {}

  async execute(corridaId: string, passageiroId: string) {
    let corrida = null;
    try {
      corrida = await this.cache.buscar(corridaId);
    } catch {
      // Redis indisponível não bloqueia a consulta à fonte de verdade.
    }

    if (corrida) {
      if (corrida.passageiroId !== passageiroId) throw new AcessoCorridaNegadoError();
      return corrida;
    }

    corrida = await this.repository.buscarPorId(corridaId);
    if (!corrida) throw new CorridaNaoEncontradaError();
    if (corrida.passageiroId !== passageiroId) throw new AcessoCorridaNegadoError();

    try {
      await this.cache.salvarSeMaisNova(corrida);
    } catch {
      // Cache é uma otimização; a resposta já foi obtida do MySQL.
    }
    return corrida;
  }
}
