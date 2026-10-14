# Decisões

Status geral: escolhas registradas; validar a implementação e atualizar as consequências conforme o desenvolvimento.

## 1. NestJS e DDD enxuto

- Contexto: regras de transição, autorização e múltiplas integrações precisam permanecer compreensíveis para a entrevista.
- Alternativas: Node com Express/Fastify; regras dentro dos controllers; camadas com domínio independente.
- Escolha: NestJS para composição/HTTP e domínio independente, com casos de uso e portas nas fronteiras. Prisma ORM 7.10 com adapter MariaDB será o adaptador MySQL, com migrations explícitas e transações nos casos de uso.
- Trade-off: mais organização e arquivos que uma implementação direta; Prisma gera tipos e simplifica migrations, mas seu modelo não substitui invariantes de domínio. A major 8 ainda não oferece MySQL; rever ao atualizar a major. [Referência oficial](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/mysql). Limitar abstrações ao necessário.

## 2. Eventos e outbox

- Contexto: salvar a corrida e publicar no broker são operações em sistemas diferentes.
- Alternativas: publicar diretamente após commit; outbox transacional; transação distribuída.
- Escolha proposta: outbox MySQL com confirmação de publicação e consumidores idempotentes; `amqplib` expõe publisher confirms e ack manual diretamente.
- Trade-off: tabela e publicador adicionais, atraso de propagação e duplicatas possíveis; reduz a janela de perda de eventos sem transação distribuída. O cliente exige gestão explícita de conexão e topologia.

## 3. Cache e fonte da verdade

- Contexto: o worker atualiza Redis de forma assíncrona e o enunciado pede GET usando cache.
- Alternativas: cache-aside com consistência eventual; verificar versão oficial em todo GET; atualizar Redis sincronicamente na API.
- Escolha: cache-aside; GET pode servir status levemente atrasado até o worker aplicar o evento, com fallback em miss/indisponibilidade. PATCH responde com o estado confirmado no MySQL.
- Trade-off: melhor aproveitamento do cache com janela explícita de consistência eventual. Autorização por proprietário ainda precisa ser aplicada também no caminho de cache.

## 4. JWT de teste com chave pública

- Contexto: o teste exige validar JWT e perfis, sem exigir um provedor de identidade.
- Alternativas: JWKS remoto; chave pública local; implementação de login com senha.
- Escolha proposta: chave pública local e tokens de teste, com validação de algoritmo, expiração, emissor e audiência.
- Trade-off: sem descoberta/rotação automática de chaves; montagem local mais simples. Nenhuma chave de produção será versionada.

Para os testes, usar Jest integrado ao NestJS. Testes unitários cobrem regras sem infraestrutura; garantias de transação e entrega serão verificadas com MySQL/RabbitMQ reais em integração, evitando tratar mocks como prova dessas garantias.

## 5. Broker sem tecnologias impostas

- Contexto: justificar também o que seria escolhido se a stack fosse livre.
- Alternativas: RabbitMQ; Kafka para log com replay e múltiplos consumidores; fila gerenciada em ambiente cloud.
- Escolha proposta: manter RabbitMQ para este fluxo de processamento assíncrono, roteamento e retries/DLQ, com operação local reproduzível.
- Trade-off: não oferece o mesmo modelo de retenção/replay de um log de eventos. Reavaliar diante de necessidades concretas de replay, escala ou infraestrutura gerenciada; nenhuma comparação de desempenho foi executada.

## 6. Auditoria e deduplicação

- Contexto: MongoDB e Redis não compartilham uma transação; o worker pode falhar após apenas um efeito.
- Alternativas: descartar imediatamente eventos já auditados; executar novamente efeitos idempotentes.
- Escolha proposta: índice único no MongoDB e cache monotônico por versão; evento já auditado ainda tenta convergir o cache antes do ack.
- Trade-off: operações repetidas na reentrega; não há garantia de exactly-once entre os dois bancos.

## 7. Leitura da projeção Redis

- Contexto: o enunciado pede leitura usando cache e o worker atualiza Redis de forma assíncrona.
- Alternativas: consultar MySQL para validar versão em todo GET; cache-aside com consistência eventual; atualizar o Redis sincronamente na API.
- Escolha proposta: cache-aside; GET pode servir status levemente atrasado até o worker aplicar o evento, e recorre a MySQL em miss/indisponibilidade. A resposta do PATCH permanece confirmada pelo MySQL.
- Trade-off: melhor aproveitamento do cache, com janela explícita de consistência eventual. Proteger autorização por proprietário também no caminho de cache.
