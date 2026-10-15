# Roteiro de demonstração (até 10 minutos)

Este roteiro prepara a gravação exigida pelo desafio. Grave somente depois de completar os itens manuais pendentes; não apresente evidências ainda não observadas como se estivessem validadas.

| Tempo | Demonstração |
| --- | --- |
| 0:00–0:40 | Apresente o problema e a árvore `api/`, `worker/`, `ui/`, `observability/`, `loadtest/` e `k8s/`. |
| 0:40–2:30 | Suba Compose e mostre UI, cadastro/login dos dois perfis e fluxo de solicitar/aceitar/finalizar corrida. |
| 2:30–3:30 | Mostre rejeição de acesso indevido e uma corrida ativa por motorista; explique a concorrência pela versão/transação no MySQL. |
| 3:30–5:00 | Explique outbox: a API grava estado e evento na mesma transação; relay publica com confirmação; worker registra auditoria e projeta Redis de forma idempotente. |
| 5:00–6:30 | Mostre métricas/alertas no Prometheus e logs correlacionados. Abra Jaeger somente se o trace fim a fim tiver sido observado no smoke final. |
| 6:30–7:30 | Explique uma decisão: manter RabbitMQ nesta carga, comparando roteamento/retries com as necessidades que poderiam justificar Kafka. |
| 7:30–8:30 | Demonstre um diagnóstico real: por exemplo, parar Redis, observar fallback MySQL e recuperação pela reentrega; relate apenas o ensaio efetivamente realizado. |
| 8:30–9:20 | Mostre relatório k6 com ambiente e resultados medidos e, se implantado, o rollout Kubernetes. |
| 9:20–10:00 | Resuma limitações e melhorias futuras. |

Antes de gravar, confira `LIMITES.md`, `docs/workflow.yaml`, o estado dos serviços e remova tokens/chaves da tela. Não use contas pessoais nem dados reais.
