import { PrismaService } from "../../../shared/database/prisma.service.js";
import type { OutboxRecord, OutboxRepository } from "../application/outbox.repository.js";

export class PrismaOutboxRepository implements OutboxRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPendentes(limite: number): Promise<OutboxRecord[]> {
    const rows = await this.prisma.eventoOutbox.findMany({
      where: { publicadoEm: null },
      orderBy: { criadoEm: "asc" },
      take: limite,
    });
    return rows.map((row) => ({
      id: row.id,
      tipo: row.tipo,
      versaoSchema: row.versaoSchema,
      ocorridoEm: row.ocorridoEm,
      correlationId: row.correlationId,
      corridaId: row.corridaId,
      versaoAgregado: row.versaoAgregado,
      payload: row.payload,
    }));
  }

  async marcarPublicado(id: string, publicadoEm: Date): Promise<void> {
    await this.prisma.eventoOutbox.updateMany({
      where: { id, publicadoEm: null },
      data: { publicadoEm },
    });
  }
}
