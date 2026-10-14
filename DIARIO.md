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
- Implementamos relay de outbox com confirmação do RabbitMQ, worker separado, histórico de eventos com deduplicação MongoDB, cache Redis com guarda atômica de versão, retries limitados e DLQ. Instalamos `amqplib`, `mongodb` e `redis`; `npm run build` compilou API e worker. A integração ainda precisa ser exercitada com os serviços locais.
- GET agora segue cache-aside: Redis primeiro, MySQL no miss ou indisponibilidade, checagem de proprietário em ambos os caminhos e preenchimento atômico do cache sem regressão de versão. Redis indisponível não bloqueia o bootstrap da API. Revisamos AC09 para remover a contradição com a consistência eventual documentada; `npm run build` compilou a alteração, mas a integração ainda depende dos serviços locais.
- Criamos a especificação de ambiente local, Dockerfile da API, Compose inicial para MySQL, RabbitMQ, MongoDB, Redis, API, worker e Prometheus, healthchecks e rota pública `/v1/health`. `docker-compose config --quiet`, parsing de YAML e `npm run build` passaram. UI React segue pendente; o daemon Docker não está acessível para build de imagens e smoke test.
- Commitamos a base Compose (`a71defa`) e implementamos UI React com fluxo de passageiro/motorista, consulta periódica e proxy Nginx; adicionamos o oitavo serviço no Compose. `ui: npm run build` passou sem vulnerabilidades reportadas pelo npm install; o fluxo integrado depende do daemon Docker.

Tempo consumido: ainda não medido. Registrar o tempo real das próximas sessões; não estimar retroativamente como se fosse medição.
