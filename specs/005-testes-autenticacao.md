# 005 — Testes isolados de autenticação e autorização

Estado: implementado; testes unitários executados com sucesso. A validação HTTP de AC01/AC02 continua pendente.

## Objetivo

Verificar o comportamento próprio do `JwtGuard` sem depender de MySQL, Redis ou do Docker. Estes testes cobrem a validação criptográfica e a autorização por perfil; não substituem os testes HTTP integrados com os serviços reais previstos em `specs/001-corridas.md`.

## Regras

- Rota marcada como pública ignora autenticação.
- Cabeçalho Bearer ausente, token inválido/expirado ou claims `sub`/`role` inválidas resultam em 401.
- JWT válido exige RS256, emissor e audiência configurados; o usuário autenticado vem de `sub` e `role` do token.
- Perfil válido que não está autorizado pela rota resulta em 403.
- Testes usam chaves RSA efêmeras e não dependem de chaves de desenvolvimento versionadas.

## Critérios de aceite

| ID | Cenário | Validação |
| --- | --- | --- |
| AUTH-01 | Rota pública passa sem token; rota protegida sem token retorna 401 | Teste unitário do guard |
| AUTH-02 | Token inválido, expirado ou com claims inválidas retorna 401 | Teste unitário do guard |
| AUTH-03 | Token RS256 válido instala a identidade a partir de `sub` e `role` | Teste unitário do guard |
| AUTH-04 | Perfil não autorizado retorna 403 | Teste unitário do guard |

## Fora de escopo

Validação HTTP ponta a ponta, autorização de propriedade de corrida e emissão de tokens por usuário; continuam sob AC01/AC02 da especificação 001 e exigem os testes integrados correspondentes.
