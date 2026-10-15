# Proposta — refatoração SOLID das fronteiras de Corridas e Worker

**Estado:** implementada e validada em 2026-10-14.

## Objetivo

Reduzir responsabilidades misturadas no processamento de eventos, fazer a composição de Corridas depender das portas da aplicação, retirar o Prisma do relay da outbox e diminuir o contrato exigido dos casos de uso de Corrida.

A refatoração deve preservar os comportamentos já acordados: MySQL continua sendo a fonte de verdade; publicar na outbox só é confirmado após confirmação do RabbitMQ; o consumidor continua idempotente; auditoria MongoDB e projeção Redis permanecem recuperáveis após falha parcial; mensagens só recebem ack depois do processamento ou do encaminhamento confirmado para retry/DLQ.

## Estado atual observado

1. `ProjectionConsumer` em `api/src/worker/projection-consumer.ts` grava auditoria no MongoDB, atualiza Redis, publica retries/DLQ e divide o arquivo com a configuração da topologia RabbitMQ.
2. `CorridasModule` em `api/src/corridas/corridas.module.ts` já registra tokens de repositório/cache, mas as factories tipam suas dependências como `PrismaCorridaRepository` e `RedisCorridaCache`.
3. `OutboxRelay` em `api/src/worker/outbox-relay.ts` consulta e atualiza `PrismaService` diretamente, além de publicar no RabbitMQ e executar o loop periódico.
4. `CorridaRepository` em `api/src/corridas/application/corrida.repository.ts` reúne criação idempotente, consulta, listagem e alteração de status, embora cada caso de uso use somente parte dessas operações.

## Solução proposta

### 1. Separar o processamento de projeções por responsabilidade

Manter um adaptador de mensagem RabbitMQ responsável pelo ciclo da entrega: validar/decodificar a mensagem, chamar o caso de uso, confirmar com `ack` e encaminhar falhas. Extrair os efeitos e configuração para contratos e adaptadores próprios:

| Responsabilidade | Componente proposto | Contrato da aplicação |
| --- | --- | --- |
| Registrar evento uma única vez | Adaptador MongoDB de auditoria | `EventoAuditRepository` |
| Atualizar estado projetado somente se a versão for mais nova | Adaptador Redis | `CorridaProjection` |
| Decidir tentativa ou DLQ e publicar com confirmação | Política/porta de retry e adaptador RabbitMQ | `RetryPublisher` |
| Criar exchanges, filas e bindings | Configurador de topologia RabbitMQ | Configuração de infraestrutura |
| Coordenar auditoria e projeção | `ProcessarEventoCorridaUseCase` | Recebe as três portas necessárias |

O consumidor não deve conhecer `Db`, `RedisClientType` nem detalhes da topologia. A composição das implementações fica no ponto de entrada do worker, `api/src/worker/main.ts`.

**Invariantes obrigatórias:**

- Mesmo quando o evento já existe no MongoDB, tentar atualizar Redis para recuperar uma falha parcial anterior.
- Só considerar o evento processado depois que auditoria e projeção terminarem.
- Se o processamento falhar, encaminhar para retry/DLQ e esperar publisher confirm antes do `ack` original.
- Se o encaminhamento falhar, fazer `nack` com requeue.
- Manter limite atual de três tentativas e retry com TTL de cinco segundos.

### 2. Fazer o módulo de Corridas compor pelas portas

Usar os tokens já existentes como fronteira de runtime e declarar o tipo das factories pelos contratos da aplicação:

```ts
useFactory: (repository: CorridaRepository) => new CriarCorridaUseCase(repository),
inject: [CORRIDA_REPOSITORY],
```

Para consulta, a factory deve receber `CorridaRepository` e `CorridaCache`. Os adaptadores concretos continuam registrados no módulo como implementações dos tokens. Assim, casos de uso e factories não precisam importar nem nomear classes Prisma/Redis.

Não criar uma abstração genérica de container: o módulo NestJS continua sendo o composition root e é o local legítimo para conhecer implementações concretas.

### 3. Introduzir uma porta de persistência da outbox

Criar um contrato `OutboxRepository` para as operações necessárias ao relay, por exemplo:

```ts
interface OutboxRepository {
  buscarPendentes(limite: number): Promise<EventoOutboxPendente[]>;
  marcarPublicado(id: string, publicadoEm: Date): Promise<boolean>;
}
```

O adaptador Prisma implementa essa porta. `OutboxRelay` passa a depender de `OutboxRepository` e da porta de publicação confirmada, sem importar `PrismaService`. O relay continua responsável por percorrer os eventos, publicar e marcar cada evento apenas após confirmação do broker.

O ponto de entrada do worker instancia `PrismaService`, o adaptador da outbox e o canal RabbitMQ, e injeta as portas no relay. A janela de falha entre confirmação RabbitMQ e marcação no MySQL continua podendo gerar publicação duplicada; consumidores seguem idempotentes, sem alegação de exactly-once.

### 4. Segregar o contrato de Corrida por leitura e escrita

Substituir a interface única por duas portas pequenas, suficientes para o uso atual:

```ts
interface CorridaCommandRepository {
  criarComIdempotencia(input: CriarCorridaComIdempotencia): Promise<ResultadoCriacao>;
  alterarStatus(input: AlterarStatusInput): Promise<Corrida>;
}

interface CorridaQueryRepository {
  buscarPorId(id: string): Promise<Corrida | null>;
  listarAbertas(limite: number): Promise<Corrida[]>;
}
```

Os casos de uso de criação e alteração recebem a porta de comandos. As políticas de consulta e o caso de uso da fila recebem a porta de consultas. `PrismaCorridaRepository` pode implementar as duas interfaces e ser registrado sob os dois tokens; não é necessário duplicar o adaptador nem criar um repositório por método.

## Sequência de implementação

1. Atualizar esta proposta para especificação de implementação, se houver mudança de contrato ou de comportamento.
2. Segregar as portas de Corrida e atualizar factories/injeção no módulo; compilar e rodar testes da API.
3. Criar a porta da outbox, o adaptador Prisma e adaptar o relay; validar publicação confirmada e falha antes da marcação.
4. Extrair as portas/adaptadores do consumidor e mover a topologia para infraestrutura; preservar o fluxo de ack/nack e a recuperação MongoDB/Redis.
5. Rodar lint, testes unitários, builds e os testes de integração com MySQL, RabbitMQ, MongoDB e Redis; atualizar workflow, diário e tarefas com evidências reais.

As etapas podem ser entregues em commits separados. A mudança do consumidor deve ser feita por último porque envolve mais garantias de falha distribuída.

## Critérios de aceite

- [x] As factories de `CorridasModule` dependem dos tipos das portas, sem tipos concretos Prisma/Redis.
- [x] Casos de uso dependem apenas das operações de repositório que consomem; adaptador Prisma satisfaz as portas de leitura e escrita.
- [x] `OutboxRelay` não importa nem injeta `PrismaService`.
- [x] O adaptador Prisma da outbox só marca como publicado depois de publisher confirm; falha não marca o evento.
- [x] O consumidor de mensagem não depende diretamente dos clientes MongoDB e Redis nem configura topologia.
- [x] Evento duplicado no Mongo continua atualizando/reparando Redis.
- [x] Falha em auditoria/projeção tenta retry; após o limite, encaminha para DLQ; falha ao publicar retry/DLQ mantém a mensagem original em requeue.
- [x] Lint, testes unitários e builds passam; os critérios de persistência e mensageria são validados com os serviços reais do Compose.
- [x] `docs/workflow.yaml`, `docs/TASKS.md` e `DIARIO.md` registram status e evidências sem marcar validação não executada.

## Riscos e limites

- Extrair portas sem preservar a ordem dos efeitos pode quebrar a recuperação de falha parcial entre MongoDB e Redis.
- Alterar ack/nack ou publisher confirms pode perder mensagens ou criar loops de reentrega; a topologia deve permanecer coberta por teste integrado.
- Separar `CorridaRepository` em muitas interfaces pequenas aumentaria cerimônia. A proposta limita a segregação inicial a comandos e consultas.
- O relay pode publicar o mesmo evento mais de uma vez após uma falha entre confirmação do RabbitMQ e marcação no MySQL; isso é comportamento esperado de entrega at-least-once.

## Fora do escopo

Esta proposta não muda contratos HTTP, formato/versionamento de eventos, estados de Corrida, topologia funcional, política de retry, bancos utilizados, nem divide API e worker em novos serviços. Também não propõe event sourcing ou exactly-once.
