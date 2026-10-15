# 009 — Implantação local em Kubernetes

## Objetivo

Disponibilizar os mesmos processos da configuração Compose em um cluster local, mantendo MySQL como fonte da verdade, um worker e uma API, com configurações não sensíveis em ConfigMap e credenciais/chaves em Secret.

## Escopo desta fatia

- Kustomize instala API, worker, UI, MySQL, RabbitMQ, MongoDB, Redis, Prometheus e Jaeger no namespace `corridas`.
- API e worker usam as imagens locais produzidas pelos Dockerfiles do repositório.
- Bancos e broker são instâncias únicas com PVC; a configuração é para demonstração em cluster local, sem alta disponibilidade.
- API e worker têm probes HTTP e recursos iniciais explícitos. Serviços de dados têm probes de processo.
- Senhas e chaves JWT são criadas no cluster pelo operador local, sem serem gravadas nos manifestos.

## Critérios de aceite

| ID | Cenário | Validação |
| --- | --- | --- |
| K8S-001 | `kubectl apply -k k8s/` inicia os componentes | Pods prontos e serviços resolvidos no cluster local |
| K8S-002 | Workloads da aplicação definem probes e requests/limits | Revisão do manifesto e estado Ready |
| K8S-003 | Configuração separa ConfigMap/Secret e não versiona valores locais | Revisão do Kustomize e comandos de preparação |
| K8S-004 | Opcional: KEDA escala worker pela fila | Requer carga e demonstração; fica fora desta fatia |

## Limites

Volumes usam a StorageClass padrão local. Réplicas únicas, credenciais de demonstração e armazenamento em memória de Jaeger não são configuração de produção. A validação depende de Docker Desktop Kubernetes ou Minikube habilitado no ambiente do candidato.
