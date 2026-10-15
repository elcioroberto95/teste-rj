import type { ConfirmChannel, ConsumeMessage } from "amqplib";
import type { ProcessarEventoCorridaUseCase } from "../application/processar-evento-corrida.use-case.js";
import type { RetryPublisher } from "../application/projection-ports.js";
import { validarEvento } from "../../contracts/event-envelope.js";

export class ProjectionConsumer {
  constructor(
    private readonly processarEvento: ProcessarEventoCorridaUseCase,
    private readonly retryPublisher: RetryPublisher,
    private readonly channel: ConfirmChannel,
  ) {}

  async handle(message: ConsumeMessage | null): Promise<void> {
    if (!message) return;

    try {
      const event = validarEvento(JSON.parse(message.content.toString("utf8")));
      await this.processarEvento.execute(event);
      this.channel.ack(message);
    } catch (error) {
      console.error("Falha ao projetar evento", error);
      try {
        await this.retryPublisher.encaminhar(message.content, message.properties.headers ?? {});
        this.channel.ack(message);
      } catch (publishError) {
        console.error("Falha ao encaminhar evento para retry", publishError);
        this.channel.nack(message, false, true);
      }
    }
  }
}
