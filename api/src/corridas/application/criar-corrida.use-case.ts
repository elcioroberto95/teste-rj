import { createHash, randomUUID } from "node:crypto";
import { criarCorrida } from "../domain/corrida.js";
import type { Corrida } from "../domain/corrida.js";
import { ChaveIdempotenciaConflitanteError } from "./errors.js";
import type { CorridaRepository } from "./corrida.repository.js";

export interface CriarCorridaCommand {
  passageiroId: string;
  chave: string;
  origem: string;
  destino: string;
  correlationId: string;
}

export class CriarCorridaUseCase {
  constructor(private readonly repository: CorridaRepository) {}

  async execute(command: CriarCorridaCommand) {
    const origem = command.origem.trim();
    const destino = command.destino.trim();
    const hashRequisicao = createHash("sha256")
      .update(JSON.stringify({ origem, destino }))
      .digest("hex");
    const corrida: Corrida = criarCorrida({
      id: randomUUID(),
      passageiroId: command.passageiroId,
      origem,
      destino,
      criadaEm: new Date(),
    });

    return this.repository.criarComIdempotencia({
      corrida,
      chave: command.chave,
      hashRequisicao,
      correlationId: command.correlationId,
    });
  }
}
