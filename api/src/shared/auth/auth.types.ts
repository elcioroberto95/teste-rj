export type Perfil = "passageiro" | "motorista";

export interface UsuarioAutenticado {
  sub: string;
  role: Perfil;
}
