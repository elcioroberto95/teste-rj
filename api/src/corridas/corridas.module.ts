import { Module } from "@nestjs/common";
import { CriarCorridaUseCase } from "./application/criar-corrida.use-case.js";
import { CORRIDA_REPOSITORY } from "./application/corrida.repository.js";
import { ConsultarCorridaUseCase } from "./application/consultar-corrida.use-case.js";
import { AlterarStatusUseCase } from "./application/alterar-status.use-case.js";
import { PrismaCorridaRepository } from "./infrastructure/prisma-corrida.repository.js";
import { CorridasController } from "./presentation/corridas.controller.js";
import { RedisCorridaCache } from "./infrastructure/redis-corrida-cache.js";
import { CORRIDA_CACHE } from "./application/corrida-cache.js";

@Module({
  controllers: [CorridasController],
  providers: [
    PrismaCorridaRepository,
    RedisCorridaCache,
    { provide: CORRIDA_CACHE, useExisting: RedisCorridaCache },
    { provide: CORRIDA_REPOSITORY, useExisting: PrismaCorridaRepository },
    {
      provide: CriarCorridaUseCase,
      useFactory: (repository: PrismaCorridaRepository) => new CriarCorridaUseCase(repository),
      inject: [CORRIDA_REPOSITORY],
    },
    {
      provide: ConsultarCorridaUseCase,
      useFactory: (repository: PrismaCorridaRepository, cache: RedisCorridaCache) =>
        new ConsultarCorridaUseCase(repository, cache),
      inject: [CORRIDA_REPOSITORY, CORRIDA_CACHE],
    },
    {
      provide: AlterarStatusUseCase,
      useFactory: (repository: PrismaCorridaRepository) => new AlterarStatusUseCase(repository),
      inject: [CORRIDA_REPOSITORY],
    },
  ],
})
export class CorridasModule {}
