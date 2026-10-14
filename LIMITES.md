# Limites e riscos

## Estado atual

API NestJS com cadastro/login, JWT RS256, POST idempotente, GET cache-aside e PATCH com transições/controle de versão; migrations de usuários, corrida, idempotência e outbox. Contas de passageiros e motoristas são persistidas no MySQL; senhas usam scrypt com salt. Relay RabbitMQ, worker com auditoria MongoDB, cache Redis, UI React, Compose com oito serviços e workflow GitHub Actions estão implementados. Em 2026-10-14 o cadastro/login foi validado via HTTP no Compose para ambos os perfis, incluindo senha incorreta, email duplicado, login após cadastro e fluxo de corrida passageiro→motorista. Lint API/UI, builds API/UI e 16 testes unitários passaram. A revisão manual da UI, concorrência simultânea, falhas/reentregas, instrumentação Prometheus, CI remoto, observabilidade completa e Kubernetes permanecem pendentes. O workflow ainda não rodou remotamente. O audit anterior registrou 24 vulnerabilidades (20 moderadas, 4 altas); as altas reportadas vinham de dependências transitivas da CLI Prisma 7.10 (`deepmerge-ts` e `mysql2`) e exigiriam downgrade major segundo o npm, que não aplicamos.

## Escopo deliberadamente excluído

- Pagamentos, geolocalização, despacho automático e cancelamento.
- Verificação de email, recuperação de senha, MFA, refresh tokens e provedor externo de identidade.
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

AUTH-01–AUTH-04 foram verificados pelos testes unitários de `api/test/jwt.guard.spec.ts`; `npm test` passou com 16 testes em 3 suítes, incluindo o hasher de senha. O fluxo HTTP integrado confirmou cadastro/login de passageiro e motorista, rejeição de credenciais incorretas, JWT com perfil, consulta pelo proprietário e 403 para outro passageiro; POST repetido manteve o mesmo ID, corpo divergente retornou 409 e as transições concluíram com projeção Redis na versão 4. Permanecem sem validação concorrência simultânea, duplicata/reentrega de eventos, falha parcial, fallback com Redis indisponível e restauração do broker.

O cadastro/login implementado usa credenciais e chave RS256 local; antes de produção, requer rotação/gestão segura de chaves, política contra abuso (rate limiting), verificação de email, recuperação de senha, MFA e hardening operacional.
