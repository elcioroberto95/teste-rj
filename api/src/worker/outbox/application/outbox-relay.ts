import type { EventoCorrida } from "../../contracts/event-envelope.js";
import type { ConfirmPublisher } from "../../messaging/confirm-publisher.js";
import type { OutboxRepository } from "./outbox.repository.js";
import { camposDoErro, logJson } from "../../../shared/observability/json-log.js";
import { incrementarMetrica } from "../../../shared/observability/metrics.js";

export class OutboxRelay {
  private running = false;

  constructor(private readonly outbox: OutboxRepository, private readonly publisher: ConfirmPublisher) {}

  async runOnce(limit = 100): Promise<number> {
    const events = await this.outbox.buscarPendentes(limit);
    let published = 0;
    for (const row of events) {
      const context = {
        event_id: row.id,
        event_type: row.tipo,
        correlation_id: row.correlationId,
        corrida_id: row.corridaId,
        aggregate_version: row.versaoAgregado,
      };
      try {
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
        incrementarMetrica("outbox_events_published_total", "Eventos publicados pela outbox", {
          event_type: row.tipo,
        });
        logJson("info", "worker", "outbox_event_published", context);
        published += 1;
      } catch (error) {
        incrementarMetrica("outbox_delivery_failures_total", "Falhas de entrega da outbox");
        logJson("error", "worker", "outbox_event_publish_failed", {
          ...context,
          ...camposDoErro(error),
        });
        throw error;
      }
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
        logJson("error", "worker", "outbox_relay_iteration_failed", camposDoErro(error));
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }
  }

  stop(): void { this.running = false; }
}
