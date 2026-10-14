export class ChaveIdempotenciaConflitanteError extends Error {
  constructor() {
    super("Idempotency-Key já foi usada com outro conteúdo");
    this.name = "ChaveIdempotenciaConflitanteError";
  }
}
