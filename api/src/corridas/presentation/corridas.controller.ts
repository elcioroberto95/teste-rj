import {
  Body,
  BadRequestException,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { UsuarioAtual } from "../../shared/auth/current-user.decorator.js";
import type { UsuarioAutenticado } from "../../shared/auth/auth.types.js";
import { Perfis } from "../../shared/auth/roles.decorator.js";
import {
  CriarCorridaUseCase,
} from "../application/criar-corrida.use-case.js";
import { ChaveIdempotenciaConflitanteError } from "../application/errors.js";
import { AlterarStatusUseCase } from "../application/alterar-status.use-case.js";
import { ConsultarCorridaUseCase } from "../application/consultar-corrida.use-case.js";
import {
  AcessoCorridaNegadoError,
  ConflitoVersaoCorridaError,
  CorridaInvalidaError,
  CorridaNaoEncontradaError,
  MotoristaNaoResponsavelError,
  TransicaoCorridaInvalidaError,
} from "../domain/corrida.js";
import { CriarCorridaDto } from "./criar-corrida.dto.js";
import { AlterarStatusDto } from "./alterar-status.dto.js";
import { ListarCorridasAbertasUseCase } from "../application/listar-corridas-abertas.use-case.js";

function rethrowHttpError(error: unknown): never {
  if (error instanceof CorridaNaoEncontradaError) throw new NotFoundException(error.message);
  if (error instanceof AcessoCorridaNegadoError || error instanceof MotoristaNaoResponsavelError) {
    throw new ForbiddenException(error.message);
  }
  if (
    error instanceof ChaveIdempotenciaConflitanteError ||
    error instanceof ConflitoVersaoCorridaError ||
    error instanceof TransicaoCorridaInvalidaError
  ) {
    throw new ConflictException(error.message);
  }
  if (error instanceof CorridaInvalidaError) throw new BadRequestException(error.message);
  throw error;
}

function correlationFromHeader(value: string | undefined): string {
  return value && /^[a-zA-Z0-9._-]{1,100}$/.test(value) ? value : randomUUID();
}

@Controller("corridas")
export class CorridasController {
  constructor(
    private readonly criarCorrida: CriarCorridaUseCase,
    private readonly consultarCorrida: ConsultarCorridaUseCase,
    private readonly alterarStatus: AlterarStatusUseCase,
    private readonly listarCorridasAbertas: ListarCorridasAbertasUseCase,
  ) {}

  @Post()
  @Perfis("passageiro")
  async criar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Headers("idempotency-key") chave: string | undefined,
    @Headers("x-correlation-id") correlationId: string | undefined,
    @Body() body: CriarCorridaDto,
  ) {
    if (!chave?.trim() || chave.length > 255) {
      throw new BadRequestException("Informe uma Idempotency-Key válida");
    }
    try {
      const result = await this.criarCorrida.execute({
        passageiroId: usuario.sub,
        chave: chave.trim(),
        origem: body.origem,
        destino: body.destino,
        correlationId: correlationFromHeader(correlationId),
      });
      return result.corrida;
    } catch (error) {
      rethrowHttpError(error);
    }
  }

  @Get("abertas")
  @Perfis("motorista")
  listarAbertas() {
    return this.listarCorridasAbertas.execute();
  }

  @Get(":id")
  @Perfis("passageiro", "motorista")
  async consultar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param("id", new ParseUUIDPipe({ version: "4" })) corridaId: string,
  ) {
    try {
      return await this.consultarCorrida.execute(corridaId, usuario.sub, usuario.role);
    } catch (error) {
      rethrowHttpError(error);
    }
  }

  @Patch(":id/status")
  @Perfis("motorista")
  async atualizarStatus(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param("id", new ParseUUIDPipe({ version: "4" })) corridaId: string,
    @Headers("x-correlation-id") correlationId: string | undefined,
    @Body() body: AlterarStatusDto,
  ) {
    try {
      return await this.alterarStatus.execute({
        corridaId,
        motoristaId: usuario.sub,
        novoStatus: body.status,
        correlationId: correlationFromHeader(correlationId),
      });
    } catch (error) {
      rethrowHttpError(error);
    }
  }
}
