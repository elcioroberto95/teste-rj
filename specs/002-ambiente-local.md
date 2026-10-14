# 002 — Ambiente local reproduzível

Estado: configuração inicial implementada; execução Docker ainda pendente neste ambiente.

## Objetivo

Subir API, worker, MySQL, RabbitMQ, MongoDB, Redis, Prometheus e UI React em uma rede local isolada, com persistência em volumes e inicialização ordenada por healthchecks. O ambiente é apenas para desenvolvimento.

## Regras

- Serviços publicados no host escutam somente em `127.0.0.1`.
- MySQL fica saudável antes da API iniciar e executar migrations.
- Worker aguarda API saudável (migrations aplicadas) e os serviços que consome.
- Credenciais do Compose são valores locais de demonstração, nunca de produção.
- Prometheus sobe com configuração mínima; instrumentação e scrape da aplicação serão adicionados na especificação de observabilidade.
- UI é servida pelo Nginx e encaminha `/v1` à API na rede interna do Compose.

## Critérios de aceite

| ID | Cenário | Validação |
| --- | --- | --- |
| LOC-01 | Compose é sintaticamente válido e define os serviços/volumes/rede esperados | `docker compose config` |
| LOC-02 | Serviços de banco e broker ficam saudáveis antes da API/worker | `docker compose up --build` + `docker compose ps` |
| LOC-03 | API aplica migration e health endpoint responde sem JWT | HTTP `/v1/health` |
| LOC-04 | Worker conecta e cria topologia RabbitMQ | logs do worker e management UI |
| LOC-05 | UI está saudável e encaminha requisições da mesma origem à API | `docker compose ps` + fluxo no navegador |

## Fora de escopo

Métricas de aplicação, traces, credenciais de produção, backup/HA e Kubernetes.
