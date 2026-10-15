import type { Collection, Db } from "mongodb";
import type { EventoCorrida } from "./event-envelope.js";
import type { EventoAuditRepository } from "./projection-ports.js";

export class MongoEventoAuditRepository implements EventoAuditRepository {
  private readonly audit: Collection;

  constructor(db: Db) {
    this.audit = db.collection("eventos_corrida");
  }

  initialize(): Promise<string> {
    return this.audit.createIndex({ event_id: 1 }, { unique: true });
  }

  async registrar(evento: EventoCorrida): Promise<void> {
    try {
      await this.audit.updateOne(
        { event_id: evento.event_id },
        { $setOnInsert: { ...evento, processado_em: new Date() } },
        { upsert: true },
      );
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
    }
  }
}
