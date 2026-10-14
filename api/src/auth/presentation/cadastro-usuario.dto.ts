import { IsEmail, IsIn, IsString, MaxLength, MinLength } from "class-validator";
import type { Perfil } from "../../shared/auth/auth.types.js";

export class CadastroUsuarioDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nome!: string;

  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  senha!: string;

  @IsIn(["passageiro", "motorista"])
  perfil!: Perfil;
}
