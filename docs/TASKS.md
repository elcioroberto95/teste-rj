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
- [x] Implementar outbox/publicador, contratos e topologia RabbitMQ; definir retries limitados/DLQ (AC10). Smoke saudável no Compose passou; falhas de publicação/retry cobertas por testes unitários.
- [x] Implementar worker, auditoria deduplicada e atualização atômica de cache por versão (AC07–09). Smoke saudável confirmou auditoria e projeção; reentrega/falha parcial cobertas por testes unitários.
- [x] Implementar GET cache-aside: Redis primeiro, MySQL no miss/falha e escrita condicionada a versão (AC09, AC11). Cache-aside e fallback permanecem com testes/validações anteriores.
- [x] Adicionar testes unitários de criação e transições do domínio; integração HTTP e concorrência no banco pendentes.
- [x] Implementar UI mínima e demonstrar fluxo básico (AC13). `localhost:3000/` serve UI HTTP 200 com cadastro/login; o proxy `/v1/health` e API direta em `localhost:3001/v1/health` respondem `status=ok`.
- [ ] Validar visualmente no navegador o cadastro, login e logout da UI com contas dos dois perfis; API e proxy same-origin já foram exercitados via HTTP.
- [ ] Configurar CI para lint, testes e build de imagens; validar execução (AC14). Workflow criado; falta execução no GitHub Actions.

## 2. Operação — peso alto

- [x] Especificar critérios de observabilidade e carga em `specs/008-operacao-observabilidade.md`.
- [x] Logs JSON com correlação atravessando API, outbox, broker e worker.
- [x] `/metrics` API/worker para requisições, latência, erros e processamento; RabbitMQ fornece métricas nativas de fila.
- [ ] OpenTelemetry e Jaeger/Tempo; obter trace real da API até o worker.
- [x] Dois alertas com limiares iniciais documentados; regras locais e PrometheusRule mantêm os mesmos grupos.
- [x] Script k6 e estrutura do relatório versionados; execução e medições reais pendentes.

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
- [x] Implementar cadastro e login para passageiros e motoristas, persistência MySQL, senha scrypt e JWT de sessão; API integrada validada para ambos os perfis. Revisão manual dos formulários da UI pendente.

## Fila de corridas para motoristas

- [x] Especificar a listagem e o aceite em specs/007-listagem-corridas-motoristas.md.
- [x] Implementar GET /corridas/abertas, restricao por perfil e aceite pela UI.
- [x] Validar listagem, aceite, remocao da fila e autorizacao por motorista via HTTP.
- [ ] Revisar manualmente no navegador o cadastro, login, listagem e aceite pelo motorista.

## Refatoração SOLID

- [x] Separar portas de escrita/leitura de Corrida e remover dependência concreta das factories.
- [x] Extrair porta/adaptador de outbox e confirmação RabbitMQ do relay.
- [x] Separar processamento de projeção, auditoria, retry e topologia do consumidor.
- [x] Validar com testes, lint, build e smoke test de MongoDB/Redis no Compose; evidências em docs/workflow.yaml e DIARIO.md.

## Organização do código

- [x] Agrupar worker por fluxo (outbox e projeção), contratos e mensageria; espelhar a estrutura nos testes.
- [x] Mover o processo e o código do worker para o diretório raiz `worker/`, com build e imagem independentes.
- [x] Colocar o cenário k6 e o relatório em `loadtest/` conforme o layout do desafio.
- [x] Alinhar README e WORKFLOW.md com a estrutura real do repositório.

## Organização das camadas da API

- [x] Agrupar casos de uso em `application/use-cases` nos contextos Auth e Corridas.
- [x] Concentrar contratos de saída em `application/ports` e manter adaptadores em infraestrutura.
- [x] Organizar testes por contexto e fluxo e atualizar documentação da estrutura.
- [x] Injetar hashing e emissão JWT pelos contratos para evitar dependência concreta nos casos de uso.
