# 007 — Fila de corridas abertas para motoristas

## Contexto

A primeira versao limitava a consulta de corridas ao passageiro e guardava seus IDs apenas na sessao do navegador. O motorista conseguia aceitar uma corrida somente se ja soubesse o ID, sem um fluxo para descobrir solicitacoes disponiveis.

## Regras

- Somente contas com perfil `motorista` podem listar corridas abertas.
- Uma corrida aberta tem status `SOLICITADA` e ainda nao tem motorista associado.
- A API retorna no maximo 50 corridas por padrao, ordenadas das mais antigas para as mais novas; o limite interno e 100.
- O motorista aceita uma corrida pela transicao existente para `ACEITA`. A associacao ao motorista autenticado e gravada junto com a transicao no MySQL.
- Um motorista pode ter no maximo uma corrida ativa; `ACEITA` e `EM_ANDAMENTO` ocupam o motorista, e `FINALIZADA` o libera para outra corrida.
- A exclusividade do motorista vale mesmo para aceitacoes simultaneas de corridas diferentes e e garantida no MySQL, nao apenas na UI.
- Se dois motoristas tentarem aceitar a mesma corrida, apenas um vence; o outro recebe conflito e deve atualizar a fila.
- Passageiros continuam consultando somente as proprias corridas. Motoristas consultam detalhes somente das corridas associadas ao proprio usuario.
- A fila usa MySQL como fonte atual. A UI atualiza a lista automaticamente a cada cinco segundos.

## Contrato

| Endpoint | Perfil | Resultado |
| --- | --- | --- |
| `GET /corridas/abertas` | motorista | Lista de corridas solicitadas sem motorista |
| `GET /corridas/:id` | passageiro dono ou motorista responsavel | Detalhes atuais da corrida |
| `PATCH /corridas/:id/status` com `ACEITA` | motorista | Aceita e vincula a corrida ao usuario autenticado |
| `PATCH /corridas/:id/status` com `ACEITA` enquanto o motorista tem outra corrida ativa | motorista | 409; corrida nao alterada |

## Criterios de aceite

| ID | Cenario observavel | Validacao |
| --- | --- | --- |
| DRV-01 | Motorista lista solicitacoes abertas sem informar IDs | Teste HTTP com MySQL |
| DRV-02 | Passageiro ou usuario anonimo nao lista fila de motoristas | Teste HTTP |
| DRV-03 | Motorista aceita pela UI e ve a corrida vinculada ao proprio usuario | Fluxo HTTP e revisao manual da UI |
| DRV-04 | Corrida aceita desaparece da fila aberta | Teste HTTP |
| DRV-05 | Motorista nao consulta corrida vinculada a outro motorista | Teste HTTP |
| DRV-06 | Motorista com corrida `ACEITA` ou `EM_ANDAMENTO` recebe 409 ao aceitar outra | Teste concorrente com MySQL |
| DRV-07 | Motorista consegue aceitar uma nova corrida depois de finalizar a anterior | Teste HTTP com MySQL |
| DRV-08 | Aceitacoes simultaneas de duas corridas diferentes pelo mesmo motorista deixam apenas uma ativa | Teste concorrente com MySQL |
