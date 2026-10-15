import { randomUUID } from "node:crypto";

const VALID_CORRELATION_ID = /^[a-zA-Z0-9._-]{1,100}$/;

export function normalizarCorrelationId(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && VALID_CORRELATION_ID.test(candidate) ? candidate : randomUUID();
}
