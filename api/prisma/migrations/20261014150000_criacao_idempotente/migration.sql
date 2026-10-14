CREATE TABLE `corridas` (
    `id` CHAR(36) NOT NULL,
    `passageiroId` VARCHAR(191) NOT NULL,
    `motoristaId` VARCHAR(191) NULL,
    `origem` VARCHAR(500) NOT NULL,
    `destino` VARCHAR(500) NOT NULL,
    `status` ENUM('SOLICITADA', 'ACEITA', 'EM_ANDAMENTO', 'FINALIZADA') NOT NULL DEFAULT 'SOLICITADA',
    `versao` INTEGER NOT NULL DEFAULT 1,
    `criadaEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadaEm` DATETIME(3) NOT NULL,

    INDEX `corridas_passageiroId_criadaEm_idx` (`passageiroId`, `criadaEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `chaves_idempotencia` (
    `id` CHAR(36) NOT NULL,
    `passageiroId` VARCHAR(191) NOT NULL,
    `chave` VARCHAR(255) NOT NULL,
    `hashRequisicao` CHAR(64) NOT NULL,
    `resposta` JSON NOT NULL,
    `criadaEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `chaves_idempotencia_passageiroId_chave_key` (`passageiroId`, `chave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `eventos_outbox` (
    `id` CHAR(36) NOT NULL,
    `tipo` VARCHAR(100) NOT NULL,
    `versaoSchema` INTEGER NOT NULL,
    `ocorridoEm` DATETIME(3) NOT NULL,
    `correlationId` VARCHAR(100) NOT NULL,
    `corridaId` CHAR(36) NOT NULL,
    `versaoAgregado` INTEGER NOT NULL,
    `payload` JSON NOT NULL,
    `publicadoEm` DATETIME(3) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `eventos_outbox_publicadoEm_criadoEm_idx` (`publicadoEm`, `criadoEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
