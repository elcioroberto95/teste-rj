# Limites e riscos

Estado revisado em 2026-10-15. Consulte [docs/workflow.yaml](docs/workflow.yaml) para critérios e evidências.

## Implementado e observado

- API NestJS e UI React com cadastro/login, perfis passageiro/motorista e fluxo de corridas.
- Worker Node em diretório e imagem próprios; outbox MySQL, RabbitMQ, auditoria MongoDB e projeção Redis.
- Regra de uma corrida ativa por motorista, inclusive disputa concorrente validada anteriormente no Compose.
- Compose válido; build da nova imagem do worker passou após a reorganização.
- API, worker e RabbitMQ coletados no Prometheus; targets ativos; endpoint da API respondeu HTTP 200.
- Dois alertas carregados no Prometheus.
- Um smoke HTTP confirmou `correlation_id` entre o header recebido/devolvido e o log JSON da API.
- OpenTelemetry configurado na API e no worker; `traceparent` é salvo na outbox, e Jaeger recebe OTLP/HTTP. Builds das duas imagens passaram; trace integrado ainda não foi observado.
- Kustomize renderiza os manifests locais; eles incluem os oito componentes, probes, recursos, PVCs e orientação para Secrets. Não há contexto Kubernetes ativo neste ambiente, portanto o rollout ainda não foi verificado.

## Pendente

- Smoke de trace OpenTelemetry percorrendo API, outbox, RabbitMQ e worker.
- Validação da mesma correlação de ponta a ponta até a projeção.
- Execução k6 e relatório com medidas reais.
- Executar lint e suíte de testes depois da reorganização dos arquivos do worker.
- Revisão manual da UI no navegador e execução remota do GitHub Actions.
- Rollout Kubernetes em cluster local, vídeo de apresentação e atualização final de documentação para entrega.

## Riscos e melhorias futuras

- Cadastro não inclui verificação de email, recuperação de senha, MFA nem rate limiting.
- Chaves JWT locais são apenas para desenvolvimento; produção exige gestão e rotação segura.
- Cache Redis é uma projeção eventual e descartável; o MySQL permanece como fonte da verdade.
- Outbox e consumo são at-least-once; deduplicação e idempotência são necessárias, sem garantia de exactly-once entre bancos.
- Limiares dos alertas são gatilhos iniciais de operação, ainda sem histórico de carga para justificar SLO.
- O relatório k6 não contém resultados até a execução do cenário.
