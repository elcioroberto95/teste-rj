# Corridas — desafio técnico Taxi.Rio

Serviço de corridas com API NestJS, worker de eventos e interface React.

**Estado atual:** API NestJS inicial implementada com POST, GET cache-aside e PATCH de corridas. Relay da outbox e worker de projeção MongoDB/Redis estão implementados. Build compila API e worker; integração aguarda os serviços locais. UI, Compose e CI ainda estão pendentes.

## Desenvolvimento

Usamos desenvolvimento guiado por especificações combinado com DDD (SDDD):

1. Especificar comportamento observável e critérios de aceite.
2. Modelar regras do domínio e contratos necessários.
3. Implementar uma fatia funcional pequena.
4. Validar os critérios com testes e evidências.
5. Registrar decisões, limitações e um commit que explique a mudança.

Consulte o [workflow e suas etapas](docs/WORKFLOW.md), o [status, blockers e critérios em YAML](docs/workflow.yaml), a [especificação inicial](specs/001-corridas.md) e o [plano de tarefas](docs/TASKS.md).

## Arquitetura proposta

```text
React --HTTP/JWT--> API NestJS --> MySQL (fonte da verdade)
                                      |
                              outbox / publicador
                                      |
                                  RabbitMQ
                                      |
                                   Worker
                                  /      \
                        Redis (cache)   MongoDB (auditoria)
```

A API e o worker serão processos separados no mesmo repositório. O domínio terá regras independentes do NestJS e das bibliotecas de persistência. Os efeitos dos eventos terão consistência eventual; o MySQL continuará sendo a referência para o estado atual.

## Registros do projeto

- [Decisões e alternativas](DECISIONS.md)
- [Diário de desenvolvimento](DIARIO.md)
- [Limites e riscos conhecidos](LIMITES.md)

## API em desenvolvimento

Requer Node.js 24 e MySQL acessível em `localhost:3306`. No PowerShell, a partir da raiz:

```powershell
Set-Location api
Copy-Item .env.example .env
npm install
npm run keys:dev
npm run db:generate
npm run db:migrate:deploy
npm run start:dev
```

Em outro terminal, com MySQL, RabbitMQ, MongoDB e Redis iniciados e variáveis configuradas no `.env`, execute `npm run start:worker`.

`POST /v1/corridas` cria com JWT RS256 de perfil `passageiro` e cabeçalho `Idempotency-Key`; `GET /v1/corridas/:id` consulta a corrida do passageiro; `PATCH /v1/corridas/:id/status` aceita, inicia ou finaliza como motorista. Gere tokens de desenvolvimento com `npm run token:dev -- passageiro passageiro-demo` ou `npm run token:dev -- motorista motorista-demo`. As chaves ficam em `api/.dev-keys/`, ignoradas pelo Git, e são apenas para desenvolvimento. A aplicação ainda não dispõe de Docker Compose; MySQL precisa ser iniciado separadamente.

## Uso de IA

Até o momento, Codex foi utilizado para ler o enunciado, discutir arquitetura e preparar o workflow e a especificação. Toda implementação deverá ser revisada e compreendida pelo candidato.

Exemplo de sugestão rejeitada ou corrigida: ainda não registrado. Preencher com um caso real durante o desenvolvimento.
