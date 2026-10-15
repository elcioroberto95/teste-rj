import type { ConfirmPublisher } from "../../messaging/confirm-publisher.js";
import type { RetryPublisher } from "../application/projection-ports.js";

export class RabbitRetryPublisher implements RetryPublisher {
  constructor(private readonly publisher: ConfirmPublisher) {}

  async encaminhar(content: Buffer, headers: Record<string, unknown> = {}): Promise<void> {
    const tentativas = Number(headers["x-retry-count"] ?? 0);
    if (tentativas >= 3) {
      this.publisher.publish("corridas.dlx", "corridas.dead", content, {
        persistent: true,
        contentType: "application/json",
        headers: { ...headers, "x-retry-count": tentativas },
      });
    } else {
      this.publisher.publish("corridas.retry", "corridas.retry", content, {
        persistent: true,
        expiration: "5000",
        contentType: "application/json",
        headers: { ...headers, "x-retry-count": tentativas + 1 },
      });
    }
    await this.publisher.waitForConfirms();
  }
}
