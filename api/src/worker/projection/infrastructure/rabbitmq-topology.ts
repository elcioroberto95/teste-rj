export interface RabbitTopologyChannel {
  assertExchange(name: string, type: string, options: object): Promise<unknown>;
  assertQueue(name: string, options: object): Promise<unknown>;
  bindQueue(queue: string, exchange: string, pattern: string): Promise<unknown>;
}

export async function configurarTopologia(channel: RabbitTopologyChannel): Promise<void> {
  await channel.assertExchange("corridas", "topic", { durable: true });
  await channel.assertExchange("corridas.retry", "direct", { durable: true });
  await channel.assertExchange("corridas.dlx", "direct", { durable: true });
  await channel.assertQueue("corridas.projecoes", { durable: true });
  await channel.assertQueue("corridas.retry.5s", {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "corridas",
      "x-dead-letter-routing-key": "corrida.retry",
    },
  });
  await channel.assertQueue("corridas.dlq", { durable: true });
  await channel.bindQueue("corridas.projecoes", "corridas", "corrida.criada");
  await channel.bindQueue("corridas.projecoes", "corridas", "corrida.status_alterado");
  await channel.bindQueue("corridas.projecoes", "corridas", "corrida.retry");
  await channel.bindQueue("corridas.retry.5s", "corridas.retry", "corridas.retry");
  await channel.bindQueue("corridas.dlq", "corridas.dlx", "corridas.dead");
}
