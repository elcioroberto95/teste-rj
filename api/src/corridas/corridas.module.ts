import { Module } from "@nestjs/common";
import { CriarCorridaUseCase } from "./application/criar-corrida.use-case.js";
import { CORRIDA_REPOSITORY } from "./application/corrida.repository.js";
import { ConsultarCorridaUseCase } from "./application/consultar-corrida.use-case.js";
import { AlterarStatusUseCase } from "./application/alterar-status.use-case.js";
import { PrismaCorridaRepository } from "./infrastructure/prisma-corrida.repository.js";
import { CorridasController } from "./presentation/corridas.controller.js";

@Module({
  controllers: [CorridasController],
  providers: [
    PrismaCorridaRepository,
    { provide: CORRIDA_REPOSITORY, useExisting: PrismaCorridaRepository },
    {
      provide: CriarCorridaUseCase,
      useFactory: (repository: PrismaCorridaRepository) => new CriarCorridaUseCase(repository),
      inject: [CORRIDA_REPOSITORY],
    },
    {
      provide: ConsultarCorridaUseCase,
      useFactory: (repository: PrismaCorridaRepository) => new ConsultarCorridaUseCase(repository),
      inject: [CORRIDA_REPOSITORY],
    },
    {
      provide: AlterarStatusUseCase,
      useFactory: (repository: PrismaCorridaRepository) => new AlterarStatusUseCase(repository),
      inject: [CORRIDA_REPOSITORY],
    },
  ],
})
export class CorridasModule {}
