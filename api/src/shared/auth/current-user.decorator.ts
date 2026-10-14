import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { UsuarioAutenticado } from "./auth.types.js";

export const UsuarioAtual = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UsuarioAutenticado =>
    context.switchToHttp().getRequest<{ user: UsuarioAutenticado }>().user,
);
