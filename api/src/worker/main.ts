import "dotenv/config";
import amqp from "amqplib";
import { MongoClient } from "mongodb";
import { createClient } from "redis";
import { PrismaService } from "../shared/database/prisma.service.js";
import { ProjectionConsumer, configurarTopologia } from "./projection-consumer.js";
import { OutboxRelay } from "./outbox-relay.js";

async function main(): Promise<void> {
  const rabbitUrl = process.env.RABBITMQ_URL;
  const mongoUrl = process.env.MONGODB_URL;
  const redisUrl = process.env.REDIS_URL;
  if (!rabbitUrl || !mongoUrl || !redisUrl) throw new Error("Configure RABBITMQ_URL, MONGODB_URL e REDIS_URL");

  const prisma = new PrismaService();
  const mongo = new MongoClient(mongoUrl);
  const redis = createClient({ url: redisUrl });
  const connection = await amqp.connect(rabbitUrl);
  const channel = await connection.createConfirmChannel();
  await Promise.all([prisma.$connect(), mongo.connect(), redis.connect()]);
  await configurarTopologia(channel);

  const consumer = new ProjectionConsumer(mongo.db(), redis, channel);
  await consumer.initialize();
  const relay = new OutboxRelay(prisma, channel);
  let stopping = false;
  const stop = () => { stopping = true; relay.stop(); };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  await channel.consume("corridas.projecoes", async (message) => {
    if (!message) return;
    try {
      await consumer.apply(message.content);
      channel.ack(message);
    } catch (error) {
      console.error("Falha ao projetar evento", error);
      try {
        await consumer.retryOrDeadLetter(message.content, message.properties.headers ?? {});
        channel.ack(message);
      } catch (publishError) {
        console.error("Falha ao encaminhar evento para retry", publishError);
        channel.nack(message, false, true);
      }
    }
  }, { noAck: false });

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
