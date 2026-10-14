# Instruções para agentes

## Objetivo do repositório

Este repositório implementa o desafio técnico de um serviço simplificado de corridas do Taxi.Rio. A entrega prioriza uma fundação reproduzível, segurança básica, processamento confiável de eventos e documentação honesta do processo. O README, as especificações e o enunciado do desafio definem o comportamento esperado; consulte-os antes de mudar escopo ou contratos.

O projeto está em planejamento enquanto os diretórios de aplicação não existirem. Não descreva componentes, comandos, testes ou resultados como implementados sem verificar o repositório e executar a validação correspondente.

## Processo SDDD

Trabalhe guiado por especificações e DDD:

1. Antes de uma fatia nova ou mudança de comportamento, leia a especificação relacionada em `specs/`.
2. Se não houver especificação, ou se o comportamento mudar, atualize ou crie `specs/NNN-nome.md` primeiro. Inclua objetivo, regras, contratos, critérios de aceite observáveis e fora de escopo.
3. Modele a linguagem, invariantes e transições do domínio antes de colocá-las em controllers, filas ou persistência.
4. Implemente uma fatia pequena que percorra as camadas necessárias e satisfaça critérios definidos.
5. Valide os critérios relevantes e registre o resultado real. Não marque tarefas concluídas nem declare garantias sem evidência.
6. Atualize `DIARIO.md`, `DECISIONS.md`, `LIMITES.md` e `docs/TASKS.md` quando a mudança produzir informação relevante.

Siga o ciclo detalhado em `docs/WORKFLOW.md`. Use `docs/workflow.yaml` como fonte oficial para status de etapas, blockers, critérios de aceite e evidências. Atualize-o ao concluir ou bloquear uma fatia; `docs/TASKS.md` é apenas a decomposição das tarefas. O enunciado sugere um orçamento curto; priorize a Parte 1, depois operação e só então Kubernetes. Registre cortes de escopo em `LIMITES.md`.

## Arquitetura e domínio

- Stack prevista: API NestJS, worker Node separado, UI React, MySQL, RabbitMQ, Redis, MongoDB e Prometheus em ambiente local com Docker Compose.
- MySQL é a fonte da verdade para corridas. RabbitMQ distribui eventos; Redis é projeção/cache de status e MongoDB mantém histórico/auditoria.
- Mantenha as regras de Corrida independentes de framework, transporte e banco. Use DDD enxuto e dependências orientadas para o domínio; aplique SOLID sem criar interfaces, serviços ou camadas sem necessidade concreta.
- API e worker são processos separados no mesmo repositório. Não crie microserviços por entidade.
- Preserve as transições especificadas: `SOLICITADA -> ACEITA -> EM_ANDAMENTO -> FINALIZADA`, com controle de versão e rejeição de transições inválidas.
- Aplique autorização por perfil e propriedade no servidor. O passageiro é identificado por `sub` do JWT; não confie em identidade enviada no corpo da requisição.
- Trate entrega do broker como at-least-once: consumidores precisam ser idempotentes, auditoria precisa de deduplicação e atualizações de cache não podem regredir a versão.
- Preserve a garantia de publicação definida na especificação, inclusive o uso de outbox se mantido. Não prometa exactly-once entre sistemas distintos.
- Trate Redis como projeção descartável; leituras devem seguir a regra de consistência e fallback documentada em `specs/001-corridas.md`.
- Contratos de eventos devem ser explícitos e versionados, com identificador do evento, tipo, versão do agregado e correlação conforme a especificação.

## Segurança e configuração

- Nunca adicione segredos reais, tokens pessoais ou credenciais de ambiente a arquivos versionados.
- Dados de autenticação locais devem ser claramente identificados como teste. Valide explicitamente algoritmo, emissor, audiência e expiração do JWT conforme a especificação.
- Use configuração por ambiente e documente valores de desenvolvimento seguros. Não registre tokens nem dados sensíveis em logs.
- Valide e limite dados de entrada na borda HTTP; o domínio também deve proteger suas invariantes.

## Qualidade e validação

- Mapeie mudanças aos critérios `ACxx` em `specs/001-corridas.md` ou aos critérios da especificação específica.
- Escreva testes de domínio para regras e testes de integração para garantias que dependem de MySQL, RabbitMQ, Redis ou MongoDB. Não substitua comportamento concorrente por mocks quando a garantia depende do banco.
- Ao finalizar uma mudança de código, execute os comandos de lint, testes e build aplicáveis e informe resultados e limitações. Se uma dependência ou serviço necessário não estiver disponível, registre o impedimento em vez de inferir sucesso.
- Para infraestrutura, valide a configuração e faça um smoke test reproduzível quando viável. Métricas, traces, carga e implantação Kubernetes só podem ser descritos como validados após execução observável.
- Prefira mudanças pequenas, com nomes claros e erros que indiquem a causa. Evite dependências novas sem necessidade do desafio.

## Documentação e histórico

- Mantenha README com passos copiáveis realmente testados, arquitetura, decisões importantes e declaração de uso de IA.
- Registre contexto, alternativas, escolha e trade-off de decisões relevantes em `DECISIONS.md` (3–8 entradas para a entrega final).
- Registre ocorrências reais e cronológicas em `DIARIO.md`; não invente falhas ou medições retrospectivas.
- Mantenha `LIMITES.md` alinhado ao que foi e não foi validado.
- Use commits pequenos e frequentes com mensagens que expliquem a mudança. Preserve o histórico solicitado pelo desafio; não faça squash.

## Escopo do desafio

Priorize nesta ordem:

1. Compose reproduzível, fluxo da API e worker, JWT e autorização, idempotência HTTP e do consumidor, testes e CI.
2. Logs correlacionados, métricas Prometheus, trace distribuído, alertas justificados e teste de carga com relatório baseado em dados reais.
3. Manifestos Kubernetes com probes, recursos e configuração segura.
4. KEDA como bônus, após os itens prioritários.

Consulte `docs/TASKS.md` para o estado atual. Em caso de conflito, siga o comportamento do enunciado; atualize as especificações e documente a decisão para manter os artefatos coerentes.
