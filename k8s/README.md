# Kubernetes local

Há manifestos Kustomize para os serviços do Compose, incluindo probes, requests/limits, PVCs locais, Prometheus e Jaeger. A configuração é voltada a um cluster local de nó único; não representa uma topologia de produção.

## Preparar

Habilite Kubernetes no Docker Desktop ou inicie um cluster Minikube. Gere as chaves locais se ainda não existirem:

```powershell
Set-Location api
npm ci
npm run keys:dev
Set-Location ..
```

Crie os Secrets no namespace antes de aplicar workloads. Estes valores são apenas para desenvolvimento local e não devem ser reutilizados:

```powershell
kubectl apply -f k8s/namespace.yaml
kubectl create secret generic corridas-runtime -n corridas `
  --from-literal=MYSQL_PASSWORD=desenvolvimento `
  --from-literal=MYSQL_ROOT_PASSWORD=root-desenvolvimento `
  --from-literal=MONGO_ROOT_PASSWORD=desenvolvimento `
  --from-literal=RABBITMQ_PASSWORD=desenvolvimento `
  --from-literal=DATABASE_URL=mysql://corridas:desenvolvimento@mysql:3306/corridas `
  --from-literal=MONGODB_URL='mongodb://root:desenvolvimento@mongo:27017/corridas?authSource=admin' `
  --from-literal=REDIS_URL=redis://redis:6379 `
  --from-literal=RABBITMQ_URL=amqp://corridas:desenvolvimento@rabbitmq:5672
kubectl create secret generic corridas-jwt-keys -n corridas `
  --from-file=public.pem=api/.dev-keys/public.pem `
  --from-file=private.pem=api/.dev-keys/private.pem
```

## Construir e aplicar

Docker Desktop Kubernetes usa imagens do Docker local. No Minikube, carregue as três imagens no cluster depois de construí-las:

```powershell
docker build -t corridas-api:local ./api
docker build -f worker/Dockerfile -t corridas-worker:local .
docker build -t corridas-ui:local ./ui
# Execute as três linhas seguintes apenas quando estiver usando Minikube.
minikube image load corridas-api:local
minikube image load corridas-worker:local
minikube image load corridas-ui:local
kubectl apply -k k8s/
kubectl -n corridas rollout status deployment/mysql --timeout=5m
kubectl -n corridas rollout status deployment/api --timeout=5m
kubectl -n corridas rollout status deployment/worker --timeout=5m
kubectl -n corridas rollout status deployment/ui --timeout=5m
kubectl -n corridas get pods,services,pvc
```

Abra a UI. Em terminais separados, os comandos opcionais abrem Prometheus e Jaeger:

```powershell
kubectl -n corridas port-forward service/ui 3000:80
kubectl -n corridas port-forward service/prometheus 9090:9090
kubectl -n corridas port-forward service/jaeger 16686:16686
```

Acesse `http://localhost:3000`, `http://localhost:9090` e `http://localhost:16686`. Para ver logs ou investigar um pod:

```powershell
kubectl -n corridas logs deployment/api
kubectl -n corridas logs deployment/worker
kubectl -n corridas describe pods
```

## Limitações

Ainda é necessário executar esses passos no cluster do candidato e registrar o resultado. PVCs usam a StorageClass padrão; dependências de dados e broker são instâncias únicas, sem HA. Jaeger guarda traces em memória. KEDA é bônus e não está incluído. Para remover a instalação, `kubectl delete -k k8s/` remove recursos e PVCs declarados; o conteúdo dos volumes pode ser apagado pelo provisionador do cluster.
