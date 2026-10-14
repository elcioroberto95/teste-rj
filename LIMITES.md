# Limites e riscos

## Estado atual

API NestJS com JWT RS256, POST idempotente, GET cache-aside e PATCH com transições/controle de versão; migration de corrida, idempotência e outbox adicionada. Prisma 7.10.0 gerou o cliente. Relay RabbitMQ, worker com auditoria MongoDB, cache Redis, UI React inicial, Compose com oito serviços e workflow GitHub Actions estão implementados. `docker-compose config --quiet`, parsing de YAML, lint API/UI, builds API/UI e cinco testes unitários de domínio passaram. O workflow ainda não rodou remotamente. Chaves RSA e emissão de JWT de desenvolvimento foram geradas localmente. Fluxo integrado, testes HTTP/concorrência, instrumentação Prometheus, CI remoto, observabilidade completa e Kubernetes permanecem pendentes. O audit atual registra 24 vulnerabilidades (20 moderadas, 4 altas); as altas reportadas vêm de dependências transitivas da CLI Prisma 7.10 (`deepmerge-ts` e `mysql2`) e exigiriam downgrade major segundo o npm, que não aplicamos. A migration e os serviços não foram executados porque o daemon Docker local não está acessível.

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
