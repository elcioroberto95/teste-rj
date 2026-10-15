import { describe, expect, it, jest } from "@jest/globals";
import { RabbitRetryPublisher } from "../src/worker/rabbit-retry.publisher.js";
import type { ConfirmPublisher } from "../src/worker/confirm-publisher.js";

describe("RabbitRetryPublisher", () => {
  it("encaminha as primeiras três falhas para a fila com TTL e espera confirmação", async () => {
    const publisher: ConfirmPublisher = {
      publish: jest.fn<ConfirmPublisher["publish"]>().mockReturnValue(true),
      waitForConfirms: jest.fn<ConfirmPublisher["waitForConfirms"]>().mockResolvedValue(undefined),
    };
    const retry = new RabbitRetryPublisher(publisher);
    const content = Buffer.from("evento");

    await retry.encaminhar(content, { "x-retry-count": 1 });

    expect(publisher.publish).toHaveBeenCalledWith("corridas.retry", "corridas.retry", content, {
      persistent: true,
      expiration: "5000",
      contentType: "application/json",
      headers: { "x-retry-count": 2 },
    });
    expect(publisher.waitForConfirms).toHaveBeenCalledTimes(1);
  });

  it("encaminha à DLQ quando o limite já foi atingido", async () => {
    const publisher: ConfirmPublisher = {
      publish: jest.fn<ConfirmPublisher["publish"]>().mockReturnValue(true),
      waitForConfirms: jest.fn<ConfirmPublisher["waitForConfirms"]>().mockResolvedValue(undefined),
    };
    const retry = new RabbitRetryPublisher(publisher);
    const content = Buffer.from("evento");

    await retry.encaminhar(content, { "x-retry-count": 3 });

    expect(publisher.publish).toHaveBeenCalledWith("corridas.dlx", "corridas.dead", content, {
      persistent: true,
      contentType: "application/json",
      headers: { "x-retry-count": 3 },
    });
    expect(publisher.waitForConfirms).toHaveBeenCalledTimes(1);
  });
});
