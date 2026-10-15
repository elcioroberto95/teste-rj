# Relatório de carga da API

## Cenário versionado

`k6/health.js` executa GET `/v1/health` com 10 usuários virtuais por 1 minuto por padrão. O endpoint público mede disponibilidade e latência da API sem criar dados nem exigir credenciais. Os limites do script (menos de 1% de falhas e p95 abaixo de 500 ms) são critérios iniciais do exercício, não SLOs medidos.

Para executar com k6 instalado:

```sh
k6 run loadtest/health.js
```

Ou com Docker Compose iniciado:

```sh
docker run --rm --add-host=host.docker.internal:host-gateway \
  -e BASE_URL=http://host.docker.internal:3000 \
  -v "$(pwd)/loadtest:/scripts" grafana/k6 run /scripts/health.js
```

## Resultado observado

Execução ainda não realizada nesta alteração. Não há medições de throughput, latência ou falhas a reportar; OPS-05 permanece pendente até a execução e o registro da saída real, incluindo data, ambiente e versão do Compose.
