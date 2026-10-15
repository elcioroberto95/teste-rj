import "dotenv/config";
import amqp from "amqplib";
import { MongoClient } from "mongodb";
import { createClient } from "redis";
import { PrismaService } from "../shared/database/prisma.service.js";
import { ProjectionConsumer } from "./projection/transport/projection-consumer.js";
import { OutboxRelay } from "./outbox/application/outbox-relay.js";
import { PrismaOutboxRepository } from "./outbox/infrastructure/prisma-outbox.repository.js";
import { MongoEventoAuditRepository } from "./projection/infrastructure/mongo-event-audit.repository.js";
import { RedisCorridaProjection } from "./projection/infrastructure/redis-corrida.projection.js";
import { ProcessarEventoCorridaUseCase } from "./projection/application/processar-evento-corrida.use-case.js";
import { RabbitRetryPublisher } from "./projection/infrastructure/rabbit-retry.publisher.js";
import { configurarTopologia } from "./projection/infrastructure/rabbitmq-topology.js";

async function main(): Promise<void> {
  const rabbitUrl = process.env.RABBITMQ_URL;
  const mongoUrl = process.env.MONGODB_URL;
  const redisUrl = process.env.REDIS_URL;
  if (!rabbitUrl || !mongoUrl || !redisUrl) throw new Error("Configure RABBITMQ_URL, MONGODB_URL e REDIS_URL");

  const prisma = new PrismaService();
  const mongo = new MongoClient(mongoUrl);
  const redis = createClient({ url: redisUrl });
  redis.on("error", (error) => console.error("Erro de conexão do Redis no worker", error));
  const connection = await amqp.connect(rabbitUrl);
  const channel = await connection.createConfirmChannel();
  await Promise.all([prisma.$connect(), mongo.connect(), redis.connect()]);
  await configurarTopologia(channel);

  const audit = new MongoEventoAuditRepository(mongo.db());
  await audit.initialize();
  const projection = new RedisCorridaProjection(redis);
  const processarEvento = new ProcessarEventoCorridaUseCase(audit, projection);
  const consumer = new ProjectionConsumer(processarEvento, new RabbitRetryPublisher(channel), channel);
  const relay = new OutboxRelay(new PrismaOutboxRepository(prisma), channel);
  let stopping = false;
  const stop = () => { stopping = true; relay.stop(); };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  await channel.consume("corridas.projecoes", (message) => consumer.handle(message), { noAck: false });

  const relayTask = relay.start();
  try {
    while (!stopping) await new Promise((resolve) => setTimeout(resolve, 500));
  } finally {
    relay.stop();
    await relayTask;
    await channel.close();
    await connection.close();
    await Promise.all([prisma.$disconnect(), mongo.close(), redis.quit()]);
  }
}

main().catch((error: unknown) => {
  console.error("Worker não iniciou", error);
  process.exitCode = 1;
});
