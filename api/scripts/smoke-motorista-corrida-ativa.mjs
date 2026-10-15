import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const apiBase = process.env.API_BASE_URL ?? "http://127.0.0.1:3001/v1";
const identificador = randomUUID();
let motoristaToken;
let corridaAtivaId;

async function requisitar(path, { token, body, headers = {} } = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const resposta = await response.json().catch(() => null);
  return { status: response.status, body: resposta };
}

async function alterarStatus(corridaId, status) {
  const response = await fetch(`${apiBase}/corridas/${corridaId}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${motoristaToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}

function assertStatus(result, expected, description) {
  assert.equal(result.status, expected, `${description}: ${JSON.stringify(result.body)}`);
}

async function criarCorrida(token, sufixo) {
  const response = await fetch(`${apiBase}/corridas`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": randomUUID(),
    },
    body: JSON.stringify({ origem: `Origem ${sufixo}`, destino: `Destino ${sufixo}` }),
  });
  const body = await response.json();
  assert.equal(response.status, 201, `Criar corrida ${sufixo}: ${JSON.stringify(body)}`);
  return body.id;
}

try {
  const passageiro = await requisitar("/auth/usuarios", {
    body: {
      nome: "Teste de concorrência",
      email: `passageiro-${identificador}@example.test`,
      senha: "senha-teste-123",
      perfil: "passageiro",
    },
  });
  assert.equal(passageiro.status, 201, "Cadastro do passageiro deve funcionar");

  const motorista = await requisitar("/auth/usuarios", {
    body: {
      nome: "Motorista de teste",
      email: `motorista-${identificador}@example.test`,
      senha: "senha-teste-123",
      perfil: "motorista",
    },
  });
  assert.equal(motorista.status, 201, "Cadastro do motorista deve funcionar");
  motoristaToken = motorista.body.accessToken;

  const corridaA = await criarCorrida(passageiro.body.accessToken, "A");
  const corridaB = await criarCorrida(passageiro.body.accessToken, "B");

  assertStatus(await alterarStatus(corridaA, "ACEITA"), 200, "Aceitar corrida A");
  corridaAtivaId = corridaA;
  assertStatus(await alterarStatus(corridaB, "ACEITA"), 409, "Bloquear corrida B enquanto A está aceita");
  assertStatus(await alterarStatus(corridaA, "EM_ANDAMENTO"), 200, "Iniciar corrida A");
  assertStatus(await alterarStatus(corridaB, "ACEITA"), 409, "Bloquear corrida B enquanto A está em andamento");
  assertStatus(await alterarStatus(corridaA, "FINALIZADA"), 200, "Finalizar corrida A");
  corridaAtivaId = undefined;
  assertStatus(await alterarStatus(corridaB, "ACEITA"), 200, "Aceitar corrida B após finalizar A");
  corridaAtivaId = corridaB;
  assertStatus(await alterarStatus(corridaB, "EM_ANDAMENTO"), 200, "Iniciar corrida B");
  assertStatus(await alterarStatus(corridaB, "FINALIZADA"), 200, "Finalizar corrida B");
  corridaAtivaId = undefined;

  const corridaC = await criarCorrida(passageiro.body.accessToken, "C");
  const corridaD = await criarCorrida(passageiro.body.accessToken, "D");
  const resultados = await Promise.all([
    alterarStatus(corridaC, "ACEITA"),
    alterarStatus(corridaD, "ACEITA"),
  ]);
  assert.deepEqual(resultados.map(({ status }) => status).sort(), [200, 409]);
  corridaAtivaId = resultados[0].status === 200 ? corridaC : corridaD;
  console.log("DRV-06: corrida ativa bloqueia novo aceite (409).");
  console.log("DRV-07: finalizar a corrida libera o motorista para outra.");
  console.log("DRV-08: dois aceites concorrentes resultaram em um 200 e um 409.");
} finally {
  if (corridaAtivaId && motoristaToken) {
    await alterarStatus(corridaAtivaId, "EM_ANDAMENTO").catch(() => undefined);
    await alterarStatus(corridaAtivaId, "FINALIZADA").catch(() => undefined);
  }
}
