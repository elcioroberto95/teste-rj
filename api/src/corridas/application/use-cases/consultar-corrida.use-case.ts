import type { Perfil } from "../../../shared/auth/auth.types.js";
import type { Corrida } from "../../domain/corrida.js";

export interface PoliticaConsultaCorrida {
  execute(corridaId: string, usuarioId: string): Promise<Corrida>;
}

export class ConsultarCorridaUseCase {
  constructor(private readonly politicas: Readonly<Record<Perfil, PoliticaConsultaCorrida>>) {}

  execute(corridaId: string, usuarioId: string, perfil: Perfil) {
    return this.politicas[perfil].execute(corridaId, usuarioId);
  }
}
