export class EmailJaCadastradoError extends Error {
  constructor() {
    super("Este email já está cadastrado");
    this.name = "EmailJaCadastradoError";
  }
}

export class CredenciaisInvalidasError extends Error {
  constructor() {
    super("Email ou senha inválidos");
    this.name = "CredenciaisInvalidasError";
  }
}
