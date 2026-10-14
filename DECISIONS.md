# Decisões

Status geral: propostas para implementação. Validar e atualizar as consequências conforme o desenvolvimento; não tratar escolhas ainda não implementadas como resultados comprovados.

## 1. NestJS e DDD enxuto

- Contexto: regras de transição, autorização e múltiplas integrações precisam permanecer compreensíveis para a entrevista.
- Alternativas: Node com Express/Fastify; regras dentro dos controllers; camadas com domínio independente.
- Escolha: NestJS para composição/HTTP e domínio independente, com casos de uso e portas nas fronteiras.
- Trade-off: mais organização e arquivos que uma implementação direta; limitar abstrações ao necessário.

## 2. Eventos e outbox

- Contexto: salvar a corrida e publicar no broker são operações em sistemas diferentes.
- Alternativas: publicar diretamente após commit; outbox transacional; transação distribuída.
- Escolha proposta: outbox MySQL com confirmação de publicação e consumidores idempotentes.
- Trade-off: tabela e publicador adicionais, atraso de propagação e duplicatas possíveis; reduz a janela de perda de eventos sem transação distribuída.

## 3. Cache e fonte da verdade

- Contexto: o worker atualiza Redis de forma assíncrona e eventos podem chegar fora de ordem.
- Alternativas: aceitar status eventualmente desatualizado; invalidar cache na API; verificar versão oficial antes de usar cache.
- Escolha proposta: verificar propriedade/versão no MySQL; usar Redis somente com versão correspondente e atualizações atômicas por versão.
- Trade-off: consulta MySQL em toda leitura e benefício limitado do cache. Favorece correção e autorização explícita; medir custo antes de otimizar.

## 4. JWT de teste com chave pública

- Contexto: o teste exige validar JWT e perfis, sem exigir um provedor de identidade.
- Alternativas: JWKS remoto; chave pública local; implementação de login com senha.
- Escolha proposta: chave pública local e tokens de teste, com validação de algoritmo, expiração, emissor e audiência.
- Trade-off: sem descoberta/rotação automática de chaves; montagem local mais simples. Nenhuma chave de produção será versionada.

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
