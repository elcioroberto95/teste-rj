FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV DATABASE_URL=mysql://corridas:desenvolvimento@localhost:3306/corridas
COPY api/package*.json ./api/
RUN cd api && npm ci
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY api/prisma ./api/prisma
COPY api/prisma.config.ts ./api/prisma.config.ts
COPY api/tsconfig.json ./api/tsconfig.json
COPY api/src/shared ./api/src/shared
COPY api/src/corridas/domain ./api/src/corridas/domain
COPY worker ./worker
RUN ln -s /app/api/node_modules /app/node_modules
RUN cd api && npm run db:generate && npm run build:worker

FROM node:24-bookworm-slim
WORKDIR /app/worker
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/worker/dist ./dist
COPY --from=build /app/api/package.json ./package.json
COPY --from=build /app/api/node_modules ./node_modules
EXPOSE 3002
CMD ["node", "dist/worker/src/main.js"]
