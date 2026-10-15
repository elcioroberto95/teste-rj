import type { EventoCorrida } from "../../contracts/event-envelope.js";
import type { ConfirmPublisher } from "../../messaging/confirm-publisher.js";
import type { OutboxRepository } from "./outbox.repository.js";

export class OutboxRelay {
  private running = false;

  constructor(private readonly outbox: OutboxRepository, private readonly publisher: ConfirmPublisher) {}

  async runOnce(limit = 100): Promise<number> {
    const events = await this.outbox.buscarPendentes(limit);
    let published = 0;
    for (const row of events) {
      const envelope: EventoCorrida = {
        event_id: row.id,
        event_type: row.tipo as EventoCorrida["event_type"],
        schema_version: row.versaoSchema,
        occurred_at: row.ocorridoEm.toISOString(),
        correlation_id: row.correlationId,
        corrida_id: row.corridaId,
        aggregate_version: row.versaoAgregado,
        payload: row.payload as EventoCorrida["payload"],
      };
      this.publisher.publish("corridas", row.tipo, Buffer.from(JSON.stringify(envelope)), {
        persistent: true,
        contentType: "application/json",
        messageId: row.id,
        correlationId: row.correlationId,
        timestamp: Math.floor(row.ocorridoEm.getTime() / 1000),
      });
      await this.publisher.waitForConfirms();
      await this.outbox.marcarPublicado(row.id, new Date());
      published += 1;
    }
    return published;
  }

  async start(intervalMs = 1000): Promise<void> {
    this.running = true;
    while (this.running) {
      try {
        const count = await this.runOnce();
        if (count === 0) await new Promise((resolve) => setTimeout(resolve, intervalMs));
      } catch (error) {
        console.error("Falha ao publicar outbox", error);
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }
  }

  stop(): void { this.running = false; }
}
