# 002 — Ambiente local reproduzível

Estado: validado em 2026-10-14 com `docker-compose up -d --build`; oito serviços iniciaram e o fluxo integrado básico foi exercitado.

## Objetivo

Subir API, worker, MySQL, RabbitMQ, MongoDB, Redis, Prometheus e UI React em uma rede local isolada, com persistência em volumes e inicialização ordenada por healthchecks. O ambiente é apenas para desenvolvimento.

## Regras

- A healthcheck do MySQL deve validar TCP em `127.0.0.1`, para não aprovar o servidor temporário que a imagem usa durante a inicialização.
- A healthcheck do RabbitMQ deve aguardar a porta AMQP sem chamar ferramentas Erlang antes do processo principal, evitando criar o cookie com proprietário incorreto.
- As imagens de build e runtime da API instalam OpenSSL para a CLI Prisma detectar a biblioteca TLS disponível.
- Serviços publicados no host escutam somente em `127.0.0.1`.
- MySQL fica saudável antes da API iniciar e executar migrations.
- Worker aguarda API saudável (migrations aplicadas) e os serviços que consome.
- Credenciais do Compose são valores locais de demonstração, nunca de produção.
- O endereço principal de demonstração é `http://localhost:3000` e abre a UI de cadastro/login; a API fica em `http://localhost:3001` para chamadas diretas, enquanto a UI usa o proxy same-origin `/v1`.
- Prometheus coleta API, worker e RabbitMQ; alertas ficam em `observability/alerts.yml` e a variante Prometheus Operator em `observability/alerts-prometheusrule.yaml`.
- UI é servida pelo Nginx e encaminha `/v1` à API na rede interna do Compose.

## Critérios de aceite

| ID | Cenário | Validação |
| --- | --- | --- |
| LOC-01 | Compose é sintaticamente válido e define os serviços/volumes/rede esperados | `docker compose config` |
| LOC-02 | Serviços de banco e broker ficam saudáveis antes da API/worker | `docker compose up --build` + `docker compose ps` |
| LOC-03 | API aplica migration e health endpoint responde sem JWT | HTTP `/v1/health` |
| LOC-04 | Worker conecta e cria topologia RabbitMQ | logs do worker e management UI |
| LOC-05 | UI está saudável e encaminha requisições da mesma origem à API | `docker compose ps` + fluxo no navegador |
| LOC-06 | URL principal abre a tela de cadastro/login, sem exibir 404 da API | `http://localhost:3000` retorna a UI; `http://localhost:3000/v1/health` retorna health da API |

## Evidências da execução

- `docker-compose config --quiet` passou e `docker-compose ps` mostrou os oito serviços em execução; API, MySQL, RabbitMQ, MongoDB, Redis e UI ficaram saudáveis. Prometheus e worker permaneceram em execução (sem healthcheck próprio).
- A migration `20261014150000_criacao_idempotente` foi aplicada pela API. `/v1/health` respondeu `{"status":"ok"}` diretamente e pelo proxy da UI em `http://127.0.0.1:8080/v1/health`.
- O worker conectou ao broker e processou um evento de criação e três transições: MongoDB registrou quatro eventos e Redis convergiu para `FINALIZADA`, versão 4.
- No HTTP: POST repetido com mesma chave/corpo retornou o mesmo ID; corpo diferente com a chave retornou 409; consulta por outro passageiro retornou 403; as transições válidas funcionaram e transição após finalização retornou 409.
- O fluxo de interface visual no navegador, falhas/reentregas, concorrência simultânea e indisponibilidade dos serviços não foram exercitados nesta validação.
- Após o ajuste de portas, `http://127.0.0.1:3000/` respondeu HTTP 200; o bundle JavaScript servido contém o campo “Token de acesso”. O health respondeu `status=ok` via proxy em `:3000/v1/health` e pela API direta em `:3001/v1/health`.

## Endereços publicados

Na configuração atual, `http://localhost:3000` é a entrada para avaliadores: a UI encaminha cadastro/login e chamadas `/v1` à API. A API também é publicada em `http://localhost:3001` para testes diretos. O mapeamento anterior (`UI:8080`, `API:3000`) fazia a raiz da porta 3000 retornar o 404 padrão do NestJS e foi substituído.

## Fora de escopo

Traces distribuídos (especificados em `specs/008-operacao-observabilidade.md`), credenciais de produção, backup/HA e Kubernetes.
