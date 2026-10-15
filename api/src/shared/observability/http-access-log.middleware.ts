import type { NextFunction, Request, Response } from "express";
import { normalizarCorrelationId } from "./correlation-id.js";
import { logJson } from "./json-log.js";
import { incrementarMetrica, observarDuracao } from "./metrics.js";

export function registrarAcessoHttp(request: Request, response: Response, next: NextFunction): void {
  const correlationId = normalizarCorrelationId(request.headers["x-correlation-id"]);
  const inicio = process.hrtime.bigint();
  request.headers["x-correlation-id"] = correlationId;
  response.setHeader("x-correlation-id", correlationId);

  response.once("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - inicio) / 1_000_000;
    const labels = { method: request.method, status: String(response.statusCode) };
    incrementarMetrica("http_requests_total", "Total de requisições HTTP concluídas", labels);
    observarDuracao(
      "http_request_duration_seconds",
      "Duração das requisições HTTP em segundos",
      durationMs / 1000,
      { method: request.method },
    );
    logJson(response.statusCode >= 500 ? "error" : "info", "api", "http_request_completed", {
      correlation_id: correlationId,
      method: request.method,
      path: request.path,
      status_code: response.statusCode,
      duration_ms: Math.round(durationMs * 100) / 100,
    });
  });

  next();
}
