import { Module } from "@nestjs/common";
import { CriarCorridaUseCase } from "./application/use-cases/criar-corrida.use-case.js";
import {
  CORRIDA_COMMAND_REPOSITORY,
  CORRIDA_QUERY_REPOSITORY,
  type CorridaCommandRepository,
  type CorridaQueryRepository,
} from "./application/ports/corrida.repository.js";
import { ConsultarCorridaUseCase } from "./application/use-cases/consultar-corrida.use-case.js";
import { AlterarStatusUseCase } from "./application/use-cases/alterar-status.use-case.js";
import { PrismaCorridaRepository } from "./infrastructure/prisma-corrida.repository.js";
import { CorridasController } from "./presentation/corridas.controller.js";
import { RedisCorridaCache } from "./infrastructure/redis-corrida-cache.js";
import { CORRIDA_CACHE, type CorridaCache } from "./application/ports/corrida-cache.js";
import { ListarCorridasAbertasUseCase } from "./application/use-cases/listar-corridas-abertas.use-case.js";
import {
  ConsultarCorridaMotoristaPolicy,
  ConsultarCorridaPassageiroPolicy,
} from "./application/policies/consulta-corrida.policies.js";

@Module({
  controllers: [CorridasController],
  providers: [
    PrismaCorridaRepository,
    RedisCorridaCache,
    { provide: CORRIDA_CACHE, useExisting: RedisCorridaCache },
    { provide: CORRIDA_COMMAND_REPOSITORY, useExisting: PrismaCorridaRepository },
    { provide: CORRIDA_QUERY_REPOSITORY, useExisting: PrismaCorridaRepository },
    {
      provide: CriarCorridaUseCase,
      useFactory: (repository: CorridaCommandRepository) => new CriarCorridaUseCase(repository),
      inject: [CORRIDA_COMMAND_REPOSITORY],
    },
    {
      provide: ConsultarCorridaUseCase,
      useFactory: (repository: CorridaQueryRepository, cache: CorridaCache) =>
        new ConsultarCorridaUseCase({
          passageiro: new ConsultarCorridaPassageiroPolicy(repository, cache),
          motorista: new ConsultarCorridaMotoristaPolicy(repository),
        }),
      inject: [CORRIDA_QUERY_REPOSITORY, CORRIDA_CACHE],
    },
    {
      provide: AlterarStatusUseCase,
      useFactory: (repository: CorridaCommandRepository) => new AlterarStatusUseCase(repository),
      inject: [CORRIDA_COMMAND_REPOSITORY],
    },
    {
      provide: ListarCorridasAbertasUseCase,
      useFactory: (repository: CorridaQueryRepository) => new ListarCorridasAbertasUseCase(repository),
      inject: [CORRIDA_QUERY_REPOSITORY],
    },
  ],
})
export class CorridasModule {}
