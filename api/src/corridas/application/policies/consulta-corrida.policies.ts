import type { CorridaCache } from "../ports/corrida-cache.js";
import type { CorridaQueryRepository } from "../ports/corrida.repository.js";
import type { PoliticaConsultaCorrida } from "../use-cases/consultar-corrida.use-case.js";
import {
  AcessoCorridaNegadoError,
  CorridaNaoEncontradaError,
  type Corrida,
} from "../../domain/corrida.js";

export class ConsultarCorridaPassageiroPolicy implements PoliticaConsultaCorrida {
  constructor(private readonly repository: CorridaQueryRepository, private readonly cache: CorridaCache) {}

  async execute(corridaId: string, usuarioId: string): Promise<Corrida> {
    let corrida: Corrida | null = null;
    try {
      corrida = await this.cache.buscar(corridaId);
    } catch {
      // Redis indisponivel nao bloqueia a consulta a fonte de verdade.
    }

    if (corrida) {
      this.validarPropriedade(corrida, usuarioId);
      return corrida;
    }

    corrida = await this.repository.buscarPorId(corridaId);
    if (!corrida) throw new CorridaNaoEncontradaError();
    this.validarPropriedade(corrida, usuarioId);

    try {
      await this.cache.salvarSeMaisNova(corrida);
    } catch {
      // Cache e uma otimizacao; a resposta ja foi obtida do MySQL.
    }
    return corrida;
  }

  private validarPropriedade(corrida: Corrida, usuarioId: string): void {
    if (corrida.passageiroId !== usuarioId) throw new AcessoCorridaNegadoError();
  }
}

export class ConsultarCorridaMotoristaPolicy implements PoliticaConsultaCorrida {
  constructor(private readonly repository: CorridaQueryRepository) {}

  async execute(corridaId: string, usuarioId: string): Promise<Corrida> {
    const corrida = await this.repository.buscarPorId(corridaId);
    if (!corrida) throw new CorridaNaoEncontradaError();
    if (corrida.motoristaId !== usuarioId) throw new AcessoCorridaNegadoError();
    return corrida;
  }
}
