import { IsIn } from "class-validator";
import type { StatusCorrida } from "../domain/corrida.js";

export class AlterarStatusDto {
  @IsIn(["ACEITA", "EM_ANDAMENTO", "FINALIZADA"])
  status!: Exclude<StatusCorrida, "SOLICITADA">;
}
