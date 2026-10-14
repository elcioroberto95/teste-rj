# Plano de tarefas

O status oficial das etapas, blockers e critérios de aceite fica em [`workflow.yaml`](workflow.yaml). Esta lista detalha as tarefas técnicas; checkboxes ajudam a decompor o trabalho, mas não substituem critérios verificados nem evidências. Cada entrega segue o ciclo de [`WORKFLOW.md`](WORKFLOW.md).

## 0. Especificação

- [x] Criar workflow SDDD e especificação inicial.
- [ ] Revisar regras propostas, contratos e orçamento antes da primeira fatia.
- [x] Registrar escolhas de ORM, cliente RabbitMQ e ferramentas de testes com justificativa curta.

## 1. Fundação — obrigatória

- [x] Criar módulo inicial da API, gerar Prisma Client e compilar (evidência no `docs/workflow.yaml`).
- [x] Preparar API NestJS, worker, React, configuração local e Compose com os oito componentes; validar saúde dos serviços. `docker-compose up -d --build`, saúde dos serviços, migration e smoke test HTTP passaram; evidências em `specs/002-ambiente-local.md`.
- [ ] Implementar entidade Corrida e transições; testar estados inválidos (AC03–04).
- [ ] Implementar migrations MySQL, criação e idempotência transacional (AC05–06).
- [ ] Implementar JWT, autorização e consulta por proprietário (AC01–02).
- [ ] Implementar alteração de status, associação de motorista e concorrência (AC03, AC12).
- [x] Implementar outbox/publicador, contratos e topologia RabbitMQ; definir retries limitados/DLQ (AC10). Falta validação integrada.
- [x] Implementar worker, auditoria deduplicada e atualização atômica de cache por versão (AC07–09). Falta validação integrada.
- [x] Implementar GET cache-aside: Redis primeiro, MySQL no miss/falha e escrita condicionada a versão (AC09, AC11). Falta validação integrada.
- [x] Adicionar testes unitários de criação e transições do domínio; integração HTTP e concorrência no banco pendentes.
- [x] Implementar UI mínima e demonstrar fluxo básico (AC13). UI e proxy `/v1/health` responderam HTTP 200; API integrada exercitada. Fluxo visual manual ainda pendente.
- [ ] Configurar CI para lint, testes e build de imagens; validar execução (AC14). Workflow criado; falta execução no GitHub Actions.

## 2. Operação — peso alto

- [ ] Especificar critérios de observabilidade e carga em `specs/002-operacao.md`.
- [ ] Logs JSON com correlação atravessando API, outbox, broker e worker.
- [ ] `/metrics` API/worker: requisições, latência, erros e processamento. Coletar tamanho/atraso de fila; distinguir métricas do broker das métricas da aplicação.
- [ ] OpenTelemetry e Jaeger/Tempo; obter trace real da API até o worker.
- [ ] Dois alertas com limiares justificados; mesmos `groups` em `observability/alerts.yml` e `observability/alerts-prometheusrule.yaml`; Prometheus carrega as regras.
- [ ] Script k6, execução e relatório com cenário, medições reais, descobertas e possíveis mudanças.

## 3. Kubernetes — peso médio

- [ ] Especificar implantação em `specs/003-kubernetes.md`, se houver orçamento.
- [ ] Manifestos para cluster local, probes, requests/limits justificados, ConfigMaps e Secrets sem credenciais reais versionadas.
- [ ] Validar implantação no cluster e documentar comandos reproduzíveis.
- [ ] Bônus: KEDA RabbitMQ com demonstração durante carga, somente se houver tempo.

## 4. Entrega

- [ ] README com comandos realmente executados para subir, testar e validar.
- [ ] DECISIONS com 3–8 entradas completas, incluindo escolha de broker sem restrição de stack.
- [ ] DIARIO com acontecimentos reais; LIMITES com pendências finais.
- [ ] Declaração de IA com exemplo real de sugestão rejeitada/corrigida.
- [ ] Revisão de segredos e identificação explícita de chaves/tokens de teste.
- [ ] Preparar e gravar vídeo de até 10 minutos com demonstração, decisão e diagnóstico.

## Verificação isolada de autenticação

- [x] Executar os testes isolados `api/test/jwt.guard.spec.ts`; passaram junto aos testes de domínio (15 testes, 2 suítes).
- [x] Validar AC01/AC02: testes JwtGuard e fluxo HTTP com consulta do proprietário e rejeição 403 para outro passageiro.
