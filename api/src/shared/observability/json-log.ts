export type LogLevel = "info" | "warn" | "error";

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
