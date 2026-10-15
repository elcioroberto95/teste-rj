export type LogLevel = "info" | "warn" | "error";

function sanitizarMensagem(value: string): string {
  return value
    .replace(/([a-z][a-z0-9+.-]*:\/\/)[^/@\s]+@/gi, "$1[redacted]@")
    .replace(/(password|passwd|token|secret|authorization)(\s*[=:]\s*)[^\s,;]+/gi, "$1$2[redacted]")
    .slice(0, 500);
}

export function camposDoErro(error: unknown): Record<string, string> {
  if (error instanceof Error) {
    return {
      error_name: sanitizarMensagem(error.name),
      error_message: sanitizarMensagem(error.message),
    };
  }
  return { error_message: sanitizarMensagem(String(error)) };
}

export function logJson(
  level: LogLevel,
  service: string,
  message: string,
  fields: Record<string, unknown> = {},
): void {
  const line = JSON.stringify({
    ...fields,
    timestamp: new Date().toISOString(),
    level,
    service,
    message,
  });

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
