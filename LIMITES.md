# Limites e riscos

Estado revisado em 2026-10-15. Consulte [docs/workflow.yaml](docs/workflow.yaml) para critérios e evidências.

## Implementado e observado

- API NestJS e UI React com cadastro/login, perfis passageiro/motorista e fluxo de corridas.
- Worker Node em diretório e imagem próprios; outbox MySQL, RabbitMQ, auditoria MongoDB e projeção Redis.
- Regra de uma corrida ativa por motorista, inclusive disputa concorrente validada anteriormente no Compose.
- Compose válido; imagens API e worker construídas após a instrumentação.
- API, worker e RabbitMQ coletados no Prometheus; targets ativos; endpoint da API respondeu HTTP 200.
- Dois alertas carregados no Prometheus.
- Um smoke HTTP confirmou `correlation_id` entre o header recebido/devolvido e o log JSON da API.

## Pendente

- Trace OpenTelemetry percorrendo API, RabbitMQ e worker.
- Validação da mesma correlação de ponta a ponta até a projeção.
- Execução k6 e relatório com medidas reais.
- Executar novamente lint e suíte de testes depois da reorganização dos arquivos do worker. O build da imagem Docker do worker já passou.
- Revisão manual da UI no navegador e execução remota do GitHub Actions.
- Manifestos Kubernetes, vídeo de apresentação e atualização final de documentação para entrega.

## Riscos e melhorias futuras

- Cadastro não inclui verificação de email, recuperação de senha, MFA nem rate limiting.
- Chaves JWT locais são apenas para desenvolvimento; produção exige gestão e rotação segura.
- Cache Redis é uma projeção eventual e descartável; o MySQL permanece como fonte da verdade.
- Outbox e consumo são at-least-once; deduplicação e idempotência são necessárias, sem garantia de exactly-once entre bancos.
- Limiares dos alertas são gatilhos iniciais de operação, ainda sem histórico de carga para justificar SLO.
- O relatório k6 não contém resultados até a execução do cenário.
