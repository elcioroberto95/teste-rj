# 001 — Fundação do serviço de corridas

Estado: especificação inicial; implementação pendente.

## Objetivo

Um passageiro solicita uma corrida, um motorista aceita/inicia/finaliza, e o passageiro acompanha seu estado. MySQL guarda o estado oficial; eventos RabbitMQ alimentam Redis e MongoDB por um worker.

As escolhas abaixo são interpretações propostas para lacunas do enunciado. Alterações devem atualizar este documento antes do código.

## Linguagem e regras

- Corrida: solicitação pertencente a um passageiro, com origem, destino, status e versão.
- Estados: `SOLICITADA -> ACEITA -> EM_ANDAMENTO -> FINALIZADA`.
- Cada alteração efetiva aumenta a versão; criação começa em 1.
- Não permitir saltos, regressões ou alterações após finalização; retornar 409.
- Aceitar associa a corrida ao motorista autenticado. Somente esse motorista pode iniciar/finalizar; outro motorista recebe 403.
- Mudanças concorrentes usam controle de versão no MySQL: apenas uma transição concorrente sobre a mesma versão pode vencer.
- Passageiro cria em seu próprio nome e consulta apenas suas corridas. O identificador do passageiro vem de `sub`, nunca do corpo.
- Motorista altera status; não pode criar corrida. Leitura de detalhes fica restrita ao passageiro proprietário nesta versão.

## Contrato HTTP proposto

JWT assinado de teste, validado com chave pública local, algoritmo permitido explícito, expiração, emissor e audiência. Claims: `sub` e `role` (`passageiro` ou `motorista`). A UI recebe um token; não haverá emissão de tokens por senha.

| Endpoint | Entrada | Sucesso | Falhas relevantes |
| --- | --- | --- | --- |
| `POST /corridas` | `Idempotency-Key`; `{ origem, destino }`, strings não vazias | 201; corrida com `id`, `status`, `versao` | 400 entrada/chave ausente; 401 JWT; 403 perfil; 409 chave com outro corpo |
| `GET /corridas/:id` | JWT do proprietário | 200; estado atual | 401 JWT; 403 propriedade/perfil; 404 inexistente |
| `PATCH /corridas/:id/status` | `{ status }`; JWT motorista | 200; corrida atualizada | 400 entrada; 401 JWT; 403 perfil/motorista; 404 inexistente; 409 transição/conflito |

Idempotência do POST tem escopo `(passageiro, chave)`. A mesma chave e o mesmo corpo retornam o mesmo ID e resposta de criação, sem novo evento de criação. O mesmo par com corpo diferente retorna 409. Restrição única e transação no MySQL garantem também o caso concorrente.

## Persistência, eventos e falhas

Proposta: persistir mudança e registro de outbox na mesma transação MySQL. Um publicador envia eventos persistentes para RabbitMQ, aguarda confirmação e marca o registro como enviado. Falha entre confirmação e marcação pode duplicar o envio; consumidores precisam tolerar isso.

Eventos: `corrida.criada` e `corrida.status_alterado`. Envelope mínimo: `event_id`, `event_type`, `schema_version`, `occurred_at`, `correlation_id`, `corrida_id`, `aggregate_version` e `payload`. Propagar contexto de trace nos headers quando a instrumentação estiver implementada.

Topologia proposta: exchange durável `corridas` do tipo topic, fila durável `corridas.projecoes` com bindings para os dois eventos e fila de mensagens mortas. Usar ack manual após efeitos concluídos. Definir mecanismo e limite de retries na tarefa de mensageria, evitando requeue infinito.

Auditoria MongoDB tem índice único por `event_id`. Cache Redis só aceita uma versão mais nova que a armazenada, em operação atômica. Uma mensagem já registrada no MongoDB ainda precisa tentar atualizar o cache: deduplicação da auditoria não pode pular a recuperação de uma falha parcial. Ack somente após os dois efeitos; reentrega converge mesmo se houver crash entre eles.

## Leitura e consistência

Consultar propriedade e versão atual no MySQL antes de servir uma projeção Redis; usar o cache somente se a versão coincidir. Em cache ausente, inválido ou Redis indisponível, responder com MySQL. Qualquer preenchimento do cache pela API também respeita comparação atômica de versão.

Essa escolha evita responder com status anterior logo após um PATCH, mas mantém uma consulta MySQL por leitura e reduz o benefício do cache. Registrar e medir esse trade-off; não prometer eliminação de consultas ao banco.

## UI mínima

Entrada de token, formulário para criar corrida, lista local dos IDs criados nesta sessão, consulta de corrida por ID e atualização periódica do status. Incluir controle para motorista alterar status por ID com seu token. A lista não terá persistência entre sessões nesta versão; não há endpoint de listagem exigido pelo enunciado.

## Critérios de aceite

| ID | Cenário observável | Validação planejada |
| --- | --- | --- |
| AC01 | Token ausente/inválido/expirado retorna 401; válido acessa sua operação | Integração HTTP |
| AC02 | Motorista criando, passageiro alterando ou passageiro lendo corrida alheia recebe 403 | Integração HTTP |
| AC03 | Criar e percorrer as três transições mantém ID e incrementa versão | Domínio + integração |
| AC04 | Saltar estado ou alterar corrida finalizada retorna 409 | Domínio + integração |
| AC05 | POSTs repetidos e concorrentes com mesma chave/corpo criam uma corrida e um registro de evento | Integração MySQL/HTTP |
| AC06 | Reutilizar chave com corpo diferente retorna 409 | Integração HTTP |
| AC07 | Evento entregue duas vezes resulta em um histórico e cache na versão correta | Integração worker |
| AC08 | Falha entre MongoDB e Redis permite recuperação na reentrega | Integração worker com falha induzida |
| AC09 | Evento antigo não regride cache; cache atrasado não regride resposta HTTP | Integração |
| AC10 | Broker indisponível não perde evento de corrida confirmada; após recuperação, a projeção converge | Integração outbox/broker |
| AC11 | Redis indisponível mantém consulta via MySQL | Integração HTTP |
| AC12 | Dois motoristas aceitando simultaneamente produzem somente um vencedor | Integração concorrente |
| AC13 | Compose inicia os oito componentes; UI executa o fluxo | Smoke test e demonstração |
| AC14 | CI executa lint, testes e build de imagens em push/PR | Execução do pipeline |

## Fora do escopo desta especificação

Pagamento, geolocalização, despacho automático, cancelamento, cadastro de usuários, event sourcing e produção em nuvem. Observabilidade e Kubernetes terão especificações próprias antes de sua implementação.
