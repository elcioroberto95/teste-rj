import type { ConfirmChannel, ConsumeMessage } from "amqplib";
import type { ProcessarEventoCorridaUseCase } from "../application/processar-evento-corrida.use-case.js";
import type { RetryPublisher } from "../application/projection-ports.js";
import { validarEvento } from "../../contracts/event-envelope.js";
import { camposDoErro, logJson } from "../../../shared/observability/json-log.js";

export class ProjectionConsumer {
  constructor(
    private readonly processarEvento: ProcessarEventoCorridaUseCase,
    private readonly retryPublisher: RetryPublisher,
    private readonly channel: ConfirmChannel,
  ) {}

  async handle(message: ConsumeMessage | null): Promise<void> {
    if (!message) return;

    let event: ReturnType<typeof validarEvento> | undefined;
    const messageContext = {
      event_id: message.properties.messageId,
      correlation_id: message.properties.correlationId,
    };
    try {
      event = validarEvento(JSON.parse(message.content.toString("utf8")));
      await this.processarEvento.execute(event);
      this.channel.ack(message);
      logJson("info", "worker", "projection_event_processed", {
        event_id: event.event_id,
        event_type: event.event_type,
        correlation_id: event.correlation_id,
        corrida_id: event.corrida_id,
        aggregate_version: event.aggregate_version,
      });
    } catch (error) {
      const context = event
        ? {
            event_id: event.event_id,
            event_type: event.event_type,
            correlation_id: event.correlation_id,
            corrida_id: event.corrida_id,
            aggregate_version: event.aggregate_version,
          }
        : messageContext;
      logJson("error", "worker", "projection_event_failed", {
        ...context,
        ...camposDoErro(error),
      });
      try {
        await this.retryPublisher.encaminhar(message.content, message.properties.headers ?? {});
        this.channel.ack(message);
        logJson("warn", "worker", "projection_event_sent_to_retry", context);
      } catch (publishError) {
        logJson("error", "worker", "projection_retry_publish_failed", {
          ...context,
          ...camposDoErro(publishError),
        });
        this.channel.nack(message, false, true);
      }
    }
  }
}
