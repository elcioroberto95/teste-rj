import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Prisma } from "../../generated/prisma/client.js";
import { PrismaService } from "../../shared/database/prisma.service.js";
import type {
  CorridaRepository,
  CriarCorridaComIdempotencia,
  ResultadoCriacao,
} from "../application/corrida.repository.js";
import { ChaveIdempotenciaConflitanteError } from "../application/errors.js";
import type { Corrida } from "../domain/corrida.js";
import {
  ConflitoVersaoCorridaError,
  CorridaNaoEncontradaError,
  transicionarCorrida,
} from "../domain/corrida.js";

function toDomain(row: {
  id: string;
  passageiroId: string;
  motoristaId: string | null;
  origem: string;
  destino: string;
  status: string;
  versao: number;
  criadaEm: Date;
}): Corrida {
  return {
    ...row,
    status: row.status as Corrida["status"],
  };
}

@Injectable()
export class PrismaCorridaRepository implements CorridaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Corrida | null> {
    const corrida = await this.prisma.corrida.findUnique({ where: { id } });
    return corrida ? toDomain(corrida) : null;
  }

  async alterarStatus(input: {
    corridaId: string;
    motoristaId: string;
    novoStatus: Corrida["status"];
    correlationId: string;
  }): Promise<Corrida> {
    return this.prisma.$transaction(async (tx) => {
      const existente = await tx.corrida.findUnique({ where: { id: input.corridaId } });
      if (!existente) throw new CorridaNaoEncontradaError();
      const corridaAtual = toDomain(existente);
      const corridaAtualizada = transicionarCorrida(
        corridaAtual,
        input.novoStatus,
        input.motoristaId,
      );
      const resultado = await tx.corrida.updateMany({
        where: {
          id: corridaAtual.id,
          status: corridaAtual.status,
          versao: corridaAtual.versao,
        },
        data: {
          status: corridaAtualizada.status,
          motoristaId: corridaAtualizada.motoristaId,
          versao: corridaAtualizada.versao,
        },
      });
      if (resultado.count !== 1) throw new ConflitoVersaoCorridaError();

      await tx.eventoOutbox.create({
        data: {
          id: randomUUID(),
          tipo: "corrida.status_alterado",
          versaoSchema: 1,
          ocorridoEm: new Date(),
          correlationId: input.correlationId,
          corridaId: corridaAtualizada.id,
          versaoAgregado: corridaAtualizada.versao,
          payload: corridaAtualizada as unknown as Prisma.InputJsonValue,
        },
      });
      return corridaAtualizada;
    });
  }

  async criarComIdempotencia(input: CriarCorridaComIdempotencia): Promise<ResultadoCriacao> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existente = await tx.chaveIdempotencia.findUnique({
          where: {
            passageiroId_chave: {
              passageiroId: input.corrida.passageiroId,
              chave: input.chave,
            },
          },
        });

        if (existente) {
          if (existente.hashRequisicao !== input.hashRequisicao) {
            throw new ChaveIdempotenciaConflitanteError();
          }
          return { corrida: existente.resposta as unknown as Corrida, repetida: true };
        }

        const corrida = await tx.corrida.create({
          data: {
            id: input.corrida.id,
            passageiroId: input.corrida.passageiroId,
            origem: input.corrida.origem,
            destino: input.corrida.destino,
            status: "SOLICITADA",
            versao: 1,
            criadaEm: input.corrida.criadaEm,
          },
        });
        const resposta = toDomain(corrida);
        const eventId = randomUUID();

        await tx.chaveIdempotencia.create({
          data: {
            passageiroId: input.corrida.passageiroId,
            chave: input.chave,
            hashRequisicao: input.hashRequisicao,
            resposta: resposta as unknown as Prisma.InputJsonValue,
          },
        });
        await tx.eventoOutbox.create({
          data: {
            id: eventId,
            tipo: "corrida.criada",
            versaoSchema: 1,
            ocorridoEm: resposta.criadaEm,
            correlationId: input.correlationId,
            corridaId: resposta.id,
            versaoAgregado: resposta.versao,
            payload: resposta as unknown as Prisma.InputJsonValue,
          },
        });

        return { corrida: resposta, repetida: false };
      });
    } catch (error) {
      if (error instanceof ChaveIdempotenciaConflitanteError) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existente = await this.prisma.chaveIdempotencia.findUnique({
          where: {
            passageiroId_chave: {
              passageiroId: input.corrida.passageiroId,
              chave: input.chave,
            },
          },
        });
        if (existente) {
          if (existente.hashRequisicao !== input.hashRequisicao) {
            throw new ChaveIdempotenciaConflitanteError();
          }
          return { corrida: existente.resposta as unknown as Corrida, repetida: true };
        }
      }
      throw error;
    }
  }
}
