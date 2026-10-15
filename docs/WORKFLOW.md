# Workflow de desenvolvimento

## Etapas e acompanhamento

O estado atual do trabalho fica em [`workflow.yaml`](workflow.yaml). Esse arquivo é a fonte de status: contém etapas, dependências, blockers, critérios de aceite, estado e evidência de validação. `TASKS.md` detalha o trabalho técnico; não use os checkboxes dele como indicador oficial de status.

Etapas previstas: **Especificação e preparação → Fundação funcional → Operação e observabilidade → Kubernetes → Revisão e entrega**. A entrega pode avançar em paralelo com Kubernetes após a fundação, conforme o tempo disponível. As prioridades e dependências estão registradas no YAML.

Use estes estados de etapa:

| Estado | Significado |
| --- | --- |
| `not_started` | Ainda não começou e as dependências não estão todas concluídas. |
| `in_progress` | Trabalho ativo; pode haver critérios pendentes. |
| `blocked` | Um blocker aberto ou dependência impede o avanço. Registre a causa no YAML. |
| `done` | Todos os critérios obrigatórios foram verificados e não há blockers abertos. |

Critérios usam `pending`, `blocked` ou `verified`. Ao marcar `verified`, preencha `evidence` com um teste executado, comando, trace, arquivo revisado ou outra evidência reproduzível. Blockers precisam de identificador, descrição, responsável, resolução proposta e etapas que bloqueiam. Quando resolvidos, altere seu estado para `resolved`; não apague o histórico sem registrar a resolução no diário.

Depois de cada fatia, atualize status, critérios e evidências em `workflow.yaml`, e registre mudanças relevantes em `DIARIO.md`. Se uma decisão alterar comportamento ou escopo, atualize primeiro a especificação pertinente e depois o workflow. Datas no YAML usam ISO (`AAAA-MM-DD`).

## Objetivo e orçamento

Entregar primeiro a fundação obrigatória do desafio, depois a operação e, por último, Kubernetes. O enunciado sugere 6–8 horas distribuídas em até 5 dias. Esse tempo inclui implementação, investigação, validação e documentação; registrar o tempo real e documentar o que ficar de fora quando o orçamento acabar.

Distribuição inicial para 8 horas, ajustável conforme o progresso:

| Etapa | Orçamento |
| --- | --- |
| Especificação e contratos | 30 min |
| Fundação, Compose e fluxo completo | 3 h |
| Falhas, testes e CI | 1 h |
| Observabilidade e carga | 2 h |
| Revisão, documentação e apresentação | 1 h |
| Kubernetes | Somente se houver tempo após as prioridades anteriores |

Os valores são metas, não estimativas comprovadas. Se a fundação consumir mais tempo, reduzir o escopo seguinte e registrar em LIMITES.md.

## Ciclo SDDD por fatia

### 1. Especificar

Criar ou atualizar `specs/NNN-nome.md` com objetivo, comportamento observável, regras, exemplos de sucesso/falha, contratos e itens fora do escopo. Marcar ambiguidades e escolher uma interpretação explícita. Evitar especificar detalhes que não alterem o comportamento ou uma decisão relevante.

Uma tarefa está pronta para implementação quando seus critérios são verificáveis e as decisões que bloqueiam o código estão resolvidas. Mudanças de requisito atualizam primeiro a especificação.

### 2. Modelar

Definir a linguagem do domínio, invariantes, estados e limites transacionais. Criar interfaces somente nas fronteiras que precisam de isolamento: persistência, publicação de eventos e acesso às projeções.

Estrutura adotada:

```text
api/src/auth/                 # Identidade e sessão
  presentation/               # HTTP e DTOs
  application/
    use-cases/                # Cadastro e login
    ports/                    # Usuário, hash de senha, emissor de token
  infrastructure/            # Prisma e segurança (scrypt/RS256)
api/src/corridas/             # Contexto de Corridas
  presentation/
  application/
    use-cases/                # Criar, consultar, alterar, listar
    ports/                    # Repositórios e cache
    policies/                 # Regras de consulta por perfil
  domain/                     # Estado e invariantes da Corrida
  infrastructure/             # Prisma e Redis
worker/
  Dockerfile       # Imagem do processo de consumo
  tsconfig.json    # Build Node separado
  src/main.ts      # Composição e ciclo de vida do processo
  src/outbox/      # MySQL -> RabbitMQ
  src/projection/  # RabbitMQ -> auditoria MongoDB e projeção Redis
  src/messaging/   # Confirmação de publicação RabbitMQ
  src/contracts/   # Envelope versionado de eventos
loadtest/          # Cenário k6 e relatório
k8s/               # Parte 3, ainda pendente
observability/     # Scrape Prometheus e alertas
ui/src/            # Fluxo mínimo do avaliador
api/test/          # Testes organizados por contexto e fluxo
```

O worker tem diretório, build e imagem próprios. Ele reutiliza Prisma e utilitários compartilhados de `api/src`, evitando duplicar esses adaptadores.

DDD orienta a modelagem; SOLID orienta as dependências. Não criar um serviço por entidade, repositórios genéricos ou camadas sem responsabilidade concreta. O primeiro contexto é Corridas; identidade será representada por claims JWT, sem construir um provedor de autenticação.

### 3. Implementar

Trabalhar em fatias verticais: entrada HTTP, regra, persistência, evento e efeito observável. Manter API e worker como processos separados no mesmo repositório, cada um com seu diretório e imagem; o worker reutiliza dependências e adaptadores compartilhados da API. Organizar cada contexto em casos de uso, portas e adaptadores, e o worker por fluxo (outbox e projeções). Não é necessário adotar event sourcing nem separar bancos de leitura e escrita para usar eventos.

Para cada fatia, implementar os testes que verificam suas regras e falhas relevantes. Usar testes unitários para transições e testes de integração para garantias de banco, broker e processamento.

### 4. Validar

Relacionar cada critério de aceite ao teste automatizado ou comando de demonstração. A presença de código não encerra uma tarefa: é necessário observar o comportamento. Registrar falhas e limitações com honestidade; não declarar carga, recuperação ou traces validados sem executá-los.

### 5. Registrar e concluir

- Atualizar `DIARIO.md` com tentativas, resultados e tempo real.
- Atualizar `DECISIONS.md` quando houver uma escolha relevante.
- Atualizar `LIMITES.md` com pendências e riscos concretos.
- Marcar tarefas concluídas somente após a validação.
- Fazer commits pequenos e explicativos, preservando o histórico.

Exemplos de mensagens: `feat: impede transição de corrida finalizada`, `fix: evita regressão do cache em eventos atrasados`, `docs: justifica chave pública local para validar JWT`.

## Critério de conclusão da fundação

- Um `docker compose up` inicia API, worker, UI, MySQL, Redis, MongoDB, RabbitMQ e Prometheus.
- Criar, consultar e alterar corrida funciona pela UI e API.
- JWT demonstra 401, acesso indevido demonstra 403 e passageiro acessa somente as próprias corridas.
- POST repetido não duplica corrida; evento repetido não duplica auditoria e converge o cache.
- Testes cobrem fluxo feliz e pelo menos duas falhas relevantes.
- GitHub Actions executa lint, testes e build das imagens em push/PR.
- README permite reproduzir a entrega com comandos testados.

## Ordem de prioridade

1. Fundação completa e verificável.
2. Logs com correlação, métricas, trace, alertas e teste de carga.
3. Kubernetes com probes, recursos e configuração.
4. KEDA, somente após as anteriores.

Antes de encerrar, reservar tempo para documentar limites e preparar o vídeo de até 10 minutos: demonstração, decisão difícil e problema diagnosticado. Não fabricar erros, medições ou justificativas retrospectivas.
