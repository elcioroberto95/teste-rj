import { Injectable } from "@nestjs/common";
import { PerfilUsuario, Prisma } from "../../generated/prisma/client.js";
import { PrismaService } from "../../shared/database/prisma.service.js";
import { EmailJaCadastradoError } from "../application/errors.js";
import type { Usuario, UsuarioRepository } from "../application/usuario.repository.js";

function mapearUsuario(row: {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  perfil: PerfilUsuario;
}): Usuario {
  return {
    ...row,
    perfil: row.perfil === PerfilUsuario.PASSAGEIRO ? "passageiro" : "motorista",
  };
}

@Injectable()
export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    return usuario ? mapearUsuario(usuario) : null;
  }

  async criar(input: Omit<Usuario, "id">): Promise<Usuario> {
    try {
      const usuario = await this.prisma.usuario.create({
        data: {
          ...input,
          perfil: input.perfil === "passageiro"
            ? PerfilUsuario.PASSAGEIRO
            : PerfilUsuario.MOTORISTA,
        },
      });
      return mapearUsuario(usuario);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new EmailJaCadastradoError();
      }
      throw error;
    }
  }
}
