# Diário de desenvolvimento

## 2026-10-14

- Lemos o desafio e discutimos NestJS, DDD, SOLID e eventos. O fluxo com RabbitMQ já é parte do enunciado.
- Confirmamos SDDD como desenvolvimento guiado por especificações combinado com DDD.
- Criamos workflow, especificação inicial, tarefas e decisões propostas. Nenhuma aplicação ou teste foi executado nesta etapa.
- Na leitura do PDF, `python` não estava disponível no PATH; utilizamos o `pdftotext` instalado com Git para extrair o enunciado.
- Retomamos a implementação: escolhemos Prisma, `amqplib` e Jest; clarificamos cache-aside com consistência eventual e resolvemos o blocker de preparação. Docker CLI existe, mas o daemon local não está acessível.
- Criamos o módulo NestJS, autenticação JWT RS256, domínio inicial da Corrida, contrato de repositório Prisma, criação idempotente e gravação transacional na outbox; adicionamos schema e migration inicial.
- Prisma 7.10.0 gerou o cliente e `npm run build` compilou a API. Nenhum teste foi adicionado ou executado. Docker indisponível impede aplicar a migration e validar o comportamento no MySQL.
- Implementamos GET por proprietário e PATCH com transições sequenciais, associação do primeiro motorista e atualização otimista por versão, gravando evento na outbox na mesma transação. O build NestJS passou após essas rotas; a garantia concorrente ainda não foi executada contra MySQL.

Tempo consumido: ainda não medido. Registrar o tempo real das próximas sessões; não estimar retroativamente como se fosse medição.
