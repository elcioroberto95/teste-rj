type Labels = Record<string, string>;

interface Counter {
  help: string;
  values: Map<string, { labels: Labels; value: number }>;
}

interface Histogram {
  help: string;
  buckets: number[];
  values: Map<string, { labels: Labels; count: number; sum: number; bucketCounts: number[] }>;
}

const counters = new Map<string, Counter>();
const histograms = new Map<string, Histogram>();

function keyFor(labels: Labels): string {
  return JSON.stringify(Object.entries(labels).sort(([a], [b]) => a.localeCompare(b)));
}

function escapeLabel(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');
}

function formatLabels(labels: Labels, extra?: [string, string]): string {
  const entries = Object.entries({ ...labels, ...(extra ? { [extra[0]]: extra[1] } : {}) });
  if (entries.length === 0) return "";
  return `{${entries.map(([name, value]) => `${name}="${escapeLabel(value)}"`).join(",")}}`;
}

export function incrementarMetrica(
  name: string,
  help: string,
  labels: Labels = {},
  value = 1,
): void {
  let metric = counters.get(name);
  if (!metric) {
    metric = { help, values: new Map() };
    counters.set(name, metric);
  }
  const key = keyFor(labels);
  const current = metric.values.get(key) ?? { labels, value: 0 };
  current.value += value;
  metric.values.set(key, current);
}

export function observarDuracao(
  name: string,
  help: string,
  value: number,
  labels: Labels = {},
  buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
): void {
  let metric = histograms.get(name);
  if (!metric) {
    metric = { help, buckets, values: new Map() };
    histograms.set(name, metric);
  }
  const key = keyFor(labels);
  const current = metric.values.get(key) ?? {
    labels,
    count: 0,
    sum: 0,
    bucketCounts: buckets.map(() => 0),
  };
  current.count += 1;
  current.sum += value;
  buckets.forEach((bucket, index) => {
    if (value <= bucket) current.bucketCounts[index] += 1;
  });
  metric.values.set(key, current);
}

export function renderizarMetricas(): string {
  const lines: string[] = [];
  for (const [name, metric] of counters) {
    lines.push(`# HELP ${name} ${metric.help}`, `# TYPE ${name} counter`);
    for (const item of metric.values.values()) {
      lines.push(`${name}${formatLabels(item.labels)} ${item.value}`);
    }
  }
  for (const [name, metric] of histograms) {
    lines.push(`# HELP ${name} ${metric.help}`, `# TYPE ${name} histogram`);
    for (const item of metric.values.values()) {
      metric.buckets.forEach((bucket, index) => {
        lines.push(`${name}_bucket${formatLabels(item.labels, ["le", String(bucket)])} ${item.bucketCounts[index]}`);
      });
      lines.push(`${name}_bucket${formatLabels(item.labels, ["le", "+Inf"])} ${item.count}`);
      lines.push(`${name}_sum${formatLabels(item.labels)} ${item.sum}`);
      lines.push(`${name}_count${formatLabels(item.labels)} ${item.count}`);
    }
  }
  return `${lines.join("\n")}\n`;
}
