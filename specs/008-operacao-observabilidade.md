# 008 — Operação e observabilidade

Estado: implementação de logs, métricas, coleta Prometheus, alertas e cenário k6 preparada; tracing distribuído e validações integradas pendentes.

## Objetivo

Permitir acompanhar uma requisição desde a API até a publicação do evento e sua projeção pelo worker, inspecionar saúde/carga dos processos e detectar falhas operacionais com evidências reproduzíveis.

## Regras e contratos

- Logs de aplicação são JSON por linha, com `timestamp`, `level`, `service` e `message`.
- A API aceita `x-correlation-id` somente quando contém 1–100 caracteres alfanuméricos, ponto, hífen ou sublinhado. Se ausente ou inválido, gera UUID; retorna o valor efetivo no mesmo header.
- O correlation ID acompanha a mudança persistida na outbox, o envelope AMQP e os logs de publicação e consumo. Logs não incluem token, senha, hash de senha ou payload completo.
- API e worker expõem `/metrics` no formato Prometheus. Métricas incluem volume, duração e erros HTTP; o worker expõe processamento, retries e falhas/DLQ. Métricas da aplicação não substituem métricas nativas do RabbitMQ.
- A configuração local coleta métricas da API, worker e RabbitMQ. Alertas terão limiares definidos com base em comportamento observado, não em valores apresentados como medidos sem execução.
- O teste de carga registra cenário, configuração, ambiente, resultados reais e limitações; não há promessa de throughput antes da medição.

## Critérios de aceite

| ID | Cenário observável | Validação |
| --- | --- | --- |
| OPS-01 | Uma requisição e seu evento podem ser correlacionados nos logs JSON da API, outbox e worker | Smoke HTTP com consulta dos logs |
| OPS-02 | API, worker e RabbitMQ expõem métricas coletadas pelo Prometheus | Scrape e consulta PromQL |
| OPS-03 | Um trace real percorre API, publicação RabbitMQ e worker | Trace exportado e inspecionado |
| OPS-04 | Dois alertas carregam no Prometheus com limiares justificados | Prometheus rules e consulta de estado |
| OPS-05 | Um cenário k6 foi executado e relatado com medições reais | Script, resultado e relatório versionados |

## Fora de escopo

Logs com dados pessoais ou payload integral, promessas de SLO sem medição, backend de observabilidade gerenciado e alertas sem relação com sintomas operacionais.
