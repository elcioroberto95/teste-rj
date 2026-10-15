# Corridas — desafio técnico Taxi.Rio

Serviço de corridas com API NestJS, worker de eventos e interface React.

**Estado atual:** API NestJS com cadastro/login de passageiros e motoristas, POST, GET cache-aside e PATCH de corridas; relay da outbox, worker de projeção MongoDB/Redis e UI React implementados. Testes unitários, lint e builds passam. Em 2026-10-14, os oito serviços foram construídos e iniciados pelo Compose; migration de usuários, autenticação por perfil, autorização, idempotência e projeção de eventos foram exercitadas via HTTP. Revisão manual da UI, concorrência simultânea, reentrega após falha, observabilidade completa, Kubernetes e execução remota do GitHub Actions seguem pendentes.

## Desenvolvimento

Usamos desenvolvimento guiado por especificações combinado com DDD (SDDD):

1. Especificar comportamento observável e critérios de aceite.
2. Modelar regras do domínio e contratos necessários.
3. Implementar uma fatia funcional pequena.
4. Validar os critérios com testes e evidências.
5. Registrar decisões, limitações e um commit que explique a mudança.

Consulte o [workflow e suas etapas](docs/WORKFLOW.md), o [status, blockers e critérios em YAML](docs/workflow.yaml), a [especificação inicial](specs/001-corridas.md) e o [plano de tarefas](docs/TASKS.md).


## Organização do código

A API fica agrupada por contexto. Em `auth` e `corridas`, `application/use-cases` contém as operações da aplicação e `application/ports` define contratos de saída; Corridas também possui `application/policies` para as consultas por perfil. Prisma, Redis, hashing e emissão JWT ficam em `infrastructure`, enquanto controllers e DTOs ficam em `presentation`. O worker é um processo separado, com dois fluxos em `api/src/worker`: `outbox` publica eventos persistidos no MySQL no RabbitMQ; `projection` consome esses eventos e atualiza auditoria MongoDB e projeção Redis. `main.ts` compõe os adaptadores e inicia os fluxos.
## Arquitetura proposta

```text
React --HTTP/JWT--> API NestJS --> MySQL (fonte da verdade)
                                      |
                              outbox / publicador
                                      |
                                  RabbitMQ
                                      |
                                   Worker
                                  /      \
                        Redis (cache)   MongoDB (auditoria)
```

A API e o worker serão processos separados no mesmo repositório. O domínio terá regras independentes do NestJS e das bibliotecas de persistência. Os efeitos dos eventos terão consistência eventual; o MySQL continuará sendo a referência para o estado atual.

## Registros do projeto

- [Decisões e alternativas](DECISIONS.md)
- [Diário de desenvolvimento](DIARIO.md)
- [Limites e riscos conhecidos](LIMITES.md)

## API em desenvolvimento

Requer Node.js 24 e MySQL acessível em `localhost:3306`. No PowerShell, a partir da raiz:

```powershell
Set-Location api
Copy-Item .env.example .env
npm install
npm run keys:dev
npm run db:generate
npm run db:migrate:deploy
npm test
npm run start:dev
```

Para iniciar a infraestrutura e a API, gere a chave de desenvolvimento e rode o Compose na raiz do repositório:

```powershell
Set-Location api
npm run keys:dev
Set-Location ..
docker compose up --build -d
docker compose ps
```

O worker aguarda a API e os serviços necessários ficarem saudáveis. No Compose, acesse `http://localhost:3000`: a UI permite criar conta ou entrar, e o proxy encaminha `/v1` para a API. A API também fica disponível diretamente em `http://localhost:3001` para testes. O Compose publica os serviços somente em localhost; as credenciais incluídas são exclusivamente para desenvolvimento local. Prometheus inicia com scrape de si próprio; métricas da API/worker ainda não foram instrumentadas. Consulte `specs/002-ambiente-local.md` para evidências e limites do smoke test.

Na UI, crie uma conta como passageiro ou motorista usando nome, email e senha (mínimo de 8 caracteres). O cadastro persiste a conta no MySQL e inicia a sessão; depois, entre com email e senha. Cada conta tem UUID gerado pelo backend e JWT RS256 de uma hora; o token fica em memória no navegador. Crie uma conta de cada perfil para demonstrar a jornada completa. Para chamadas manuais, `POST /v1/corridas` exige JWT de passageiro e `Idempotency-Key`; `GET /v1/corridas/:id` consulta como proprietário; `PATCH /v1/corridas/:id/status` altera como motorista. Gere a chave local antes com `npm run keys:dev`; arquivos em `api/.dev-keys/` são ignorados pelo Git e servem apenas ao ambiente local. O script `npm run token:dev` permanece disponível para testes manuais.

## Uso de IA

Até o momento, Codex foi utilizado para ler o enunciado, discutir arquitetura e preparar o workflow e a especificação. Toda implementação deverá ser revisada e compreendida pelo candidato.

Exemplo de sugestão rejeitada ou corrigida: ainda não registrado. Preencher com um caso real durante o desenvolvimento.
