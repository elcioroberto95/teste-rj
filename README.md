# Corridas — desafio técnico Taxi.Rio

Serviço de corridas com API NestJS, worker de eventos e interface React.

**Estado atual:** planejamento e especificação. A aplicação ainda não foi implementada; não há comandos de execução disponíveis.

## Desenvolvimento

Usamos desenvolvimento guiado por especificações combinado com DDD (SDDD):

1. Especificar comportamento observável e critérios de aceite.
2. Modelar regras do domínio e contratos necessários.
3. Implementar uma fatia funcional pequena.
4. Validar os critérios com testes e evidências.
5. Registrar decisões, limitações e um commit que explique a mudança.

Consulte o [workflow e suas etapas](docs/WORKFLOW.md), o [status, blockers e critérios em YAML](docs/workflow.yaml), a [especificação inicial](specs/001-corridas.md) e o [plano de tarefas](docs/TASKS.md).

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

## Uso de IA

Até o momento, Codex foi utilizado para ler o enunciado, discutir arquitetura e preparar o workflow e a especificação. Toda implementação deverá ser revisada e compreendida pelo candidato.

Exemplo de sugestão rejeitada ou corrigida: ainda não registrado. Preencher com um caso real durante o desenvolvimento.
