# Limites e riscos

## Estado atual

API NestJS com JWT RS256, POST idempotente, GET cache-aside e PATCH com transições/controle de versão; migration de corrida, idempotência e outbox adicionada. Prisma 7.10.0 gerou o cliente. Relay RabbitMQ, worker com auditoria MongoDB, cache Redis, UI React inicial, Compose com oito serviços e workflow GitHub Actions estão implementados. Em 2026-10-14 `docker-compose up -d --build` subiu os oito serviços, aplicou a migration e passou no smoke test integrado descrito em `specs/002-ambiente-local.md`. Lint API/UI, builds API/UI e 15 testes unitários (domínio e JwtGuard) passaram. O workflow ainda não rodou remotamente. Chaves RSA e emissão de JWT de desenvolvimento foram geradas localmente. Concorrência simultânea, falhas/reentregas, instrumentação Prometheus, CI remoto, observabilidade completa e Kubernetes permanecem pendentes. O audit anterior registrou 24 vulnerabilidades (20 moderadas, 4 altas); as altas reportadas vinham de dependências transitivas da CLI Prisma 7.10 (`deepmerge-ts` e `mysql2`) e exigiriam downgrade major segundo o npm, que não aplicamos.

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

## Validação de autenticação

AUTH-01–AUTH-04 foram verificados pelos testes unitários de `api/test/jwt.guard.spec.ts` (parte do `npm test`, 15 testes em 2 suítes). O fluxo HTTP integrado confirmou autenticação, consulta pelo proprietário e 403 para outro passageiro; POST repetido manteve o mesmo ID, corpo divergente retornou 409 e as transições concluíram com projeção Redis na versão 4. Permanecem sem validação concorrência simultânea, duplicata/reentrega de eventos, falha parcial, fallback com Redis indisponível e restauração do broker.
