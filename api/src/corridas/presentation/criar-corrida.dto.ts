import { IsString, MaxLength, MinLength } from "class-validator";

export class CriarCorridaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  origem!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  destino!: string;
}
