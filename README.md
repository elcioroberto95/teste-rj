# Corridas — desafio técnico Taxi.Rio

Serviço simplificado de corridas com UI React, API NestJS, worker Node, MySQL, RabbitMQ, Redis e MongoDB. O MySQL é a fonte da verdade; eventos da outbox atualizam a auditoria no MongoDB e a projeção/cache no Redis.

## Estado e limites atuais

A fundação funcional inclui cadastro/login de passageiros e motoristas, autorização por perfil, idempotência, criação e transições de corrida, fila de corridas abertas e limite de uma corrida ativa por motorista. API e worker são processos separados e têm código em diretórios próprios. O Compose também inicia UI e Prometheus.

A etapa de operação tem logs JSON, métricas Prometheus para API/worker, scrape do RabbitMQ, dois alertas e instrumentação OpenTelemetry configurada com Jaeger. Faltam inspecionar um trace completo API→outbox→RabbitMQ→worker e executar o cenário k6 com resultados reais. A Parte 3 tem manifests Kustomize para cluster local, mas ainda não foi implantada. Veja [LIMITES.md](LIMITES.md), [Kubernetes local](k8s/README.md) e o [workflow oficial](docs/workflow.yaml) para o estado detalhado.

## Estrutura

```text
README.md
DECISIONS.md
DIARIO.md
LIMITES.md
docker-compose.yml
api/                      API, domínio Corridas, autenticação, Prisma e testes
worker/                   processo Node: outbox e projeção
ui/                       interface React e proxy Nginx
k8s/                      manifests Kustomize para cluster local
observability/             Prometheus e regras de alerta
loadtest/                  script k6 e relatório de carga
specs/                     especificações por fatia
docs/                      workflow, status e tarefas
.github/workflows/         CI
```

## Iniciar com Docker Compose

Requer Docker com Compose. Gere a chave local antes da primeira subida:

```powershell
Set-Location api
npm ci
npm run keys:dev
Set-Location ..
docker compose up --build -d
docker compose ps
```

A UI fica em [http://localhost:3000](http://localhost:3000). A API fica disponível pelo proxy em `/v1` e diretamente em [http://localhost:3001](http://localhost:3001). A chave gerada em `api/.dev-keys/` é local e ignorada pelo Git. Credenciais do Compose são exclusivamente de desenvolvimento.

Para encerrar os containers e manter os volumes:

```powershell
docker compose down
```

Para remover também os dados locais:

```powershell
docker compose down -v
```

## Fluxo demonstrável

1. Cadastre uma conta com perfil passageiro e outra com perfil motorista.
2. Entre como passageiro e solicite uma corrida.
3. Entre como motorista, consulte a fila de corridas abertas e aceite uma.
4. Avance o status até `EM_ANDAMENTO` e `FINALIZADA`.
5. Confira a corrida na UI e na API. Um motorista que já tem corrida ativa recebe conflito ao aceitar outra.

As regras completas de autorização, idempotência e transição estão em [specs/001-corridas.md](specs/001-corridas.md) e [specs/007-listagem-corridas-motoristas.md](specs/007-listagem-corridas-motoristas.md).

## Desenvolvimento e validação

Com as dependências locais instaladas em `api/`:

```powershell
Set-Location api
npm ci
npm run db:generate
npm run build
npm run build:worker
npm run lint
npm test
```

Os testes de integração com serviços usam o Compose. O script `npm run smoke:active-driver` valida a regra de uma corrida ativa por motorista quando o ambiente local está iniciado.

## Operação

- UI: [http://localhost:3000](http://localhost:3000)
- Saúde da API: [http://localhost:3001/v1/health](http://localhost:3001/v1/health)
- Métricas da API: [http://localhost:3001/metrics](http://localhost:3001/metrics)
- Alertas carregados no Prometheus: [http://localhost:9090/alerts](http://localhost:9090/alerts)
- Traces OpenTelemetry (Jaeger): [http://localhost:16686](http://localhost:16686)
- Métricas do worker: endpoint interno `worker:3002/metrics`, coletado pelo Prometheus.
- Métricas nativas do RabbitMQ: coletadas pelo plugin Prometheus do broker.

Os logs JSON usam `correlation_id` e não registram payloads. O smoke HTTP confirmou a propagação no header e no log de acesso da API; a jornada completa pelo broker e worker ainda está pendente.

O cenário k6 está em [loadtest/health.js](loadtest/health.js). A execução e o relatório com medições reais ainda precisam ser concluídos; consulte [loadtest/REPORT.md](loadtest/REPORT.md). Os critérios e a justificativa dos alertas estão em [specs/008-operacao-observabilidade.md](specs/008-operacao-observabilidade.md).

Os manifests Kubernetes estão em [k8s/](k8s/), com comandos para Docker Desktop Kubernetes ou Minikube. O Kustomize local renderiza a árvore; a implantação precisa ser executada em um cluster habilitado.

## Histórico do desenvolvimento

- [DECISIONS.md](DECISIONS.md): contexto, alternativas, escolha e trade-offs.
- [DIARIO.md](DIARIO.md): registro cronológico de tentativas e resultados.
- [LIMITES.md](LIMITES.md): itens ausentes e riscos conhecidos.
- [docs/WORKFLOW.md](docs/WORKFLOW.md): processo SDDD.
- [docs/workflow.yaml](docs/workflow.yaml): status oficial, critérios e evidências.
- [docs/TASKS.md](docs/TASKS.md): decomposição técnica.
- [docs/ROTEIRO-DEMO.md](docs/ROTEIRO-DEMO.md): sequência para a gravação final.

## Uso de IA

Codex foi usado para discutir arquitetura, revisar especificações, implementar e reorganizar código, documentação e configuração, além de ajudar na investigação de falhas. A pessoa candidata deve revisar e ser capaz de explicar cada decisão e mudança.

Uma sugestão inicial foi manter o código do worker dentro de `api/src/worker` para compartilhar build e dependências. Ao comparar com a estrutura pedida no desafio, essa escolha foi corrigida: o processo e o código do worker agora ficam em `worker/`, com build e imagem próprios. Outra direção inicial de usar uma sessão de demonstração foi substituída, a pedido do candidato, por cadastro e login persistidos para os perfis passageiro e motorista.
