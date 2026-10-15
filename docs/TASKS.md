# Plano de tarefas

O status oficial das etapas, blockers e critérios de aceite fica em [`workflow.yaml`](workflow.yaml). Esta lista detalha as tarefas técnicas; checkboxes ajudam a decompor o trabalho, mas não substituem critérios verificados nem evidências. Cada entrega segue o ciclo de [`WORKFLOW.md`](WORKFLOW.md).

## 0. Especificação

- [x] Criar workflow SDDD e especificação inicial.
- [x] Revisar regras propostas, contratos e orçamento antes da primeira fatia.
- [x] Registrar escolhas de ORM, cliente RabbitMQ e ferramentas de testes com justificativa curta.

## 1. Fundação — obrigatória

- [x] Criar módulo inicial da API, gerar Prisma Client e compilar (evidência no `docs/workflow.yaml`).
- [x] Preparar API NestJS, worker, React, configuração local e Compose com os oito componentes; validar saúde dos serviços. `docker-compose up -d --build`, saúde dos serviços, migration e smoke test HTTP passaram; evidências em `specs/002-ambiente-local.md`.
- [x] Implementar entidade Corrida e transições; testar estados inválidos (AC03–04). Reexecutar a suíte na validação final.
- [x] Implementar migrations MySQL, criação e idempotência transacional (AC05–06).
- [x] Implementar JWT, autorização e consulta por proprietário (AC01–02).
- [x] Implementar alteração de status, associação de motorista e concorrência (AC03, AC12).
- [x] Implementar outbox/publicador, contratos e topologia RabbitMQ; definir retries limitados/DLQ (AC10). Smoke saudável no Compose passou; falhas de publicação/retry cobertas por testes unitários.
- [x] Implementar worker, auditoria deduplicada e atualização atômica de cache por versão (AC07–09). Smoke saudável confirmou auditoria e projeção; reentrega/falha parcial cobertas por testes unitários.
- [x] Implementar GET cache-aside: Redis primeiro, MySQL no miss/falha e escrita condicionada a versão (AC09, AC11). Cache-aside e fallback permanecem com testes/validações anteriores.
- [x] Adicionar testes unitários de criação e transições do domínio; integração HTTP e concorrência no banco pendentes.
- [x] Implementar UI mínima e demonstrar fluxo básico (AC13). `localhost:3000/` serve UI HTTP 200 com cadastro/login; o proxy `/v1/health` e API direta em `localhost:3001/v1/health` respondem `status=ok`.
- [ ] Validar visualmente no navegador o cadastro, login e logout da UI com contas dos dois perfis; API e proxy same-origin já foram exercitados via HTTP.
- [x] Configurar CI para lint, testes e build de imagens (AC14); workflow criado e validação local equivalente anterior registrada. Execução remota ainda pendente.

## 2. Operação — peso alto

- [x] Especificar critérios de observabilidade e carga em `specs/008-operacao-observabilidade.md`.
- [x] Implementar logs JSON com correlação atravessando API, outbox, broker e worker; o smoke fim a fim continua pendente.
- [x] `/metrics` API/worker para requisições, latência, erros e processamento; RabbitMQ fornece métricas nativas de fila.
- [x] Configurar OpenTelemetry/Jaeger e propagar traceparent pela outbox; obter trace real da API até o worker ainda pendente.
- [x] Dois alertas com limiares iniciais documentados; regras locais e PrometheusRule mantêm os mesmos grupos.
- [x] Script k6 e relatório versionados; execução e medições reais pendentes.

## 3. Kubernetes — peso médio

- [x] Especificar implantação em `specs/009-kubernetes.md`.
- [x] Criar manifestos locais com probes, requests/limits, ConfigMaps e referências a Secrets sem valores versionados; `kubectl kustomize k8s` renderiza a configuração.
- [ ] Validar rollout no cluster; este ambiente não tem contexto Kubernetes ativo. Comandos reproduzíveis em `k8s/README.md`.
- [ ] Bônus: KEDA RabbitMQ com demonstração durante carga, somente se houver tempo.

## 4. Entrega

- [x] README com comandos e estado das validações executadas/pedentes.
- [x] DECISIONS com 8 entradas, incluindo escolha de broker sem restrição de stack.
- [x] DIARIO com acontecimentos reais; LIMITES com pendências finais.
- [x] Declaração de IA com exemplos reais de sugestões corrigidas.
- [ ] Revisão de segredos e identificação explícita de chaves/tokens de teste.
- [ ] Preparar e gravar vídeo de até 10 minutos com demonstração, decisão e diagnóstico.
- [x] Preparar roteiro da demonstração em `docs/ROTEIRO-DEMO.md`; a gravação continua pendente.

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
