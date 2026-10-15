import { IsIn } from "class-validator";
import { STATUS_CORRIDA, type StatusCorrida } from "../domain/corrida.js";

const STATUS_ALTERAVEIS = STATUS_CORRIDA.filter((status) => status !== "SOLICITADA");

export class AlterarStatusDto {
  @IsIn(STATUS_ALTERAVEIS)
  status!: Exclude<StatusCorrida, "SOLICITADA">;
}
