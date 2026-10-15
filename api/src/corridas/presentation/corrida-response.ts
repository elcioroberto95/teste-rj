import { proximoStatusCorrida, type Corrida } from "../domain/corrida.js";

export function apresentarCorrida(corrida: Corrida) {
  return {
    ...corrida,
    proximoStatus: proximoStatusCorrida(corrida.status),
  };
}
