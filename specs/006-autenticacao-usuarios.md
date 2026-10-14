# 006 — Cadastro e login de usuários

Estado: API implementada e validada no Compose; revisão manual dos formulários da UI continua pendente.

## Objetivo

Permitir que uma pessoa crie uma conta de passageiro ou motorista, faça login com email e senha e use a UI sem receber JWT manualmente.

## Regras

- Usuários são persistidos no MySQL com ID UUID gerado pelo backend, nome, email normalizado, hash da senha, perfil e data de criação.
- Os únicos perfis são `passageiro` e `motorista`; o perfil é escolhido no cadastro e não pode ser alterado pelo formulário de login.
- Email é único, comparado em minúsculas e sem espaços nas pontas.
- Senha tem no mínimo 8 caracteres; somente o hash scrypt com salt aleatório é persistido.
- Cadastro cria o usuário e inicia a sessão imediatamente. Login valida as credenciais sem revelar se o email existe.
- JWT RS256 inclui `sub` como ID persistido do usuário e `role` como perfil armazenado; validade de uma hora.
- Chave privada de assinatura é local/segredo de ambiente, nunca versionada. A chave pública continua sendo usada pelo JwtGuard.
- Tokens ficam somente em memória na UI; logout limpa a sessão do navegador.

## Contratos

| Endpoint | Entrada | Sucesso | Falhas |
| --- | --- | --- | --- |
| `POST /v1/auth/usuarios` | `{ nome, email, senha, perfil }` | 201; usuário público e JWT | 400 dados inválidos; 409 email já cadastrado |
| `POST /v1/auth/sessoes` | `{ email, senha }` | 200; usuário público e JWT | 400 dados inválidos; 401 credenciais inválidas |

Os retornos nunca incluem senha ou hash. O JWT segue o mesmo `issuer`, `audience` e RS256 já exigidos pelo guard.

## Critérios de aceite

| ID | Cenário | Validação |
| --- | --- | --- |
| AUTH-05 | Cadastro cria usuário passageiro e retorna JWT válido com ID/perfil correspondentes | API + MySQL + JwtGuard |
| AUTH-06 | Cadastro cria usuário motorista e retorna JWT válido com ID/perfil correspondentes | API + MySQL + JwtGuard |
| AUTH-07 | Login correto retorna novo JWT para a conta persistida | API + MySQL |
| AUTH-08 | Senha incorreta retorna 401 sem expor existência do email | API + MySQL |
| AUTH-09 | Email duplicado retorna 409 e senha nunca aparece em resposta/banco em texto puro | API + MySQL |
| AUTH-10 | UI permite cadastrar, entrar, alternar entre os dois perfis e sair | Fluxo manual integrado |

## Fora de escopo

Verificação por email, recuperação de senha, refresh token, MFA, login social, rate limiting distribuído e gestão administrativa de contas.
