# Corridas — desafio técnico Taxi.Rio

Serviço de corridas com API NestJS, worker de eventos e interface React.

**Estado atual:** API NestJS com POST, GET cache-aside e PATCH de corridas; relay da outbox e worker de projeção MongoDB/Redis implementados. Compose inicial e healthcheck da API adicionados, mas ainda aguardam validação com daemon Docker. UI e CI continuam pendentes.

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

Para iniciar a infraestrutura e a API, gere a chave de desenvolvimento e rode o Compose na raiz do repositório:

```powershell
Set-Location api
npm run keys:dev
Set-Location ..
docker compose up --build -d
docker compose ps
```

O worker aguarda a API e os serviços necessários ficarem saudáveis. O Compose publica os serviços somente em localhost; as credenciais incluídas são exclusivamente para desenvolvimento local. A interface React e a instrumentação Prometheus da aplicação ainda não estão incluídas.

`POST /v1/corridas` cria com JWT RS256 de perfil `passageiro` e cabeçalho `Idempotency-Key`; `GET /v1/corridas/:id` consulta a corrida do passageiro; `PATCH /v1/corridas/:id/status` aceita, inicia ou finaliza como motorista. Gere tokens de desenvolvimento com `npm run token:dev -- passageiro passageiro-demo` ou `npm run token:dev -- motorista motorista-demo`. As chaves ficam em `api/.dev-keys/`, ignoradas pelo Git, e são apenas para desenvolvimento. O Compose inicial está disponível acima; ainda falta validar a subida dos containers neste ambiente.

## Uso de IA

Até o momento, Codex foi utilizado para ler o enunciado, discutir arquitetura e preparar o workflow e a especificação. Toda implementação deverá ser revisada e compreendida pelo candidato.

Exemplo de sugestão rejeitada ou corrigida: ainda não registrado. Preencher com um caso real durante o desenvolvimento.
