# Limites e riscos

## Estado atual

Apenas o planejamento está implementado. API, worker, UI, Compose, CI, testes, observabilidade e Kubernetes permanecem pendentes. Não há evidências de execução da aplicação.

## Escopo deliberadamente excluído

- Pagamentos, geolocalização, despacho automático e cancelamento.
- Cadastro e autenticação por senha; serão usados JWTs de teste.
- Event sourcing, transações distribuídas e serviços adicionais por entidade.
- Listagem persistente de corridas na UI entre sessões na versão inicial.

## Riscos a validar

- Outbox e retries adicionam implementação ao orçamento curto; validar o fluxo de recuperação antes de declarar confiabilidade.
- Cache com verificação de versão mantém dependência do MySQL em cada leitura; medir o benefício real.
- Deduplicação da auditoria não pode impedir a recuperação do cache após falha parcial.
- Políticas de retry, retenção de outbox/eventos e idempotency keys ainda precisam de definição operacional.
- Kubernetes e KEDA dependem do tempo restante após fundação e operação.

Atualizar este documento durante o trabalho e distinguir pendências temporárias dos limites finais da entrega.
