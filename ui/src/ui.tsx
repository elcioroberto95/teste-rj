import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type Corrida = {
  id: string;
  origem: string;
  destino: string;
  status: "SOLICITADA" | "ACEITA" | "EM_ANDAMENTO" | "FINALIZADA";
  versao: number;
  criadaEm: string;
  motoristaId: string | null;
};

type Perfil = "passageiro" | "motorista";
type Usuario = { id: string; nome: string; email: string; perfil: Perfil };
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
type ModoAuth = "cadastro" | "login";
const PROXIMO_STATUS: Partial<Record<Corrida["status"], Corrida["status"]>> = {
  SOLICITADA: "ACEITA",
  ACEITA: "EM_ANDAMENTO",
  EM_ANDAMENTO: "FINALIZADA",
};

function idsDaSessao(): string[] {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem("corridas.ids") ?? "[]");
    return Array.isArray(stored) && stored.every((id) => typeof id === "string") ? stored : [];
  } catch {
    return [];
  }
}

function erroDaResposta(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message: unknown }).message;
    return Array.isArray(message) ? message.join(" · ") : String(message);
  }
  return fallback;
}

export default function App() {
  const [token, setToken] = useState("");
  const [perfil, setPerfil] = useState<Perfil>("passageiro");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [modoAuth, setModoAuth] = useState<ModoAuth>("cadastro");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [ids, setIds] = useState(idsDaSessao);
  const [idBusca, setIdBusca] = useState(ids[0] ?? "");
  const [corrida, setCorrida] = useState<Corrida | null>(null);
  const [corridasAbertas, setCorridasAbertas] = useState<Corrida[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const api = useCallback(async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${API_BASE}/v1${path}`, {
      ...init,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token.trim()}`,
        ...init.headers,
      },
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) throw new Error(erroDaResposta(body, `Falha HTTP ${response.status}`));
    return body as T;
  }, [token]);

  const consultar = useCallback(async (id: string, quiet = false) => {
    if (!id.trim() || !token.trim()) return;
    try {
      const current = await api<Corrida>(`/corridas/${encodeURIComponent(id.trim())}`);
      setCorrida(current);
      if (!quiet) setNotice({ kind: "success", text: "Estado atualizado." });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Não foi possível consultar." });
    }
  }, [api, token]);

  const carregarCorridasAbertas = useCallback(async (quiet = false) => {
    if (!token.trim() || perfil !== "motorista") return;
    try {
      setCorridasAbertas(await api<Corrida[]>("/corridas/abertas"));
    } catch (error) {
      if (!quiet) setNotice({ kind: "error", text: error instanceof Error ? error.message : "Falha ao carregar corridas abertas." });
    }
  }, [api, perfil, token]);

  useEffect(() => {
    if (!token.trim() || perfil !== "motorista") {
      setCorridasAbertas([]);
      return;
    }
    void carregarCorridasAbertas(true);
    const timer = window.setInterval(() => void carregarCorridasAbertas(true), 5000);
    return () => window.clearInterval(timer);
  }, [carregarCorridasAbertas, perfil, token]);

  useEffect(() => {
    if (!idBusca || !token.trim()) return;
    const timer = window.setInterval(() => void consultar(idBusca, true), 5000);
    return () => window.clearInterval(timer);
  }, [consultar, idBusca, token]);

  const proximoStatus = useMemo(() => corrida && PROXIMO_STATUS[corrida.status], [corrida]);

  async function autenticar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const cadastro = modoAuth === "cadastro";
      const response = await fetch(`${API_BASE}/v1/auth/${cadastro ? "usuarios" : "sessoes"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cadastro ? { nome, email, senha, perfil } : { email, senha }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(erroDaResposta(body, `Falha HTTP ${response.status}`));
      if (!body || typeof body !== "object" || !("accessToken" in body) || typeof body.accessToken !== "string" || !("user" in body)) {
        throw new Error("A API não retornou uma sessão válida.");
      }
      const authenticatedUser = body.user as Usuario;
      setToken(body.accessToken);
      setUsuario(authenticatedUser);
      setPerfil(authenticatedUser.perfil);
      setCorrida(null);
      setIdBusca("");
      setIds([]);
      sessionStorage.removeItem("corridas.ids");
      setSenha("");
      setNotice({ kind: "success", text: cadastro ? "Conta criada e sessão iniciada." : "Login realizado." });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Não foi possível iniciar a sessão." });
    } finally {
      setBusy(false);
    }
  }

  function sair() {
    setToken("");
    setUsuario(null);
    setCorrida(null);
    setCorridasAbertas([]);
    setNotice({ kind: "success", text: "Sessão encerrada." });
  }

  async function criar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const created = await api<Corrida>("/corridas", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ origem, destino }),
      });
      const next = [created.id, ...ids.filter((id) => id !== created.id)].slice(0, 10);
      sessionStorage.setItem("corridas.ids", JSON.stringify(next));
      setIds(next);
      setIdBusca(created.id);
      setCorrida(created);
      setOrigem("");
      setDestino("");
      setNotice({ kind: "success", text: "Corrida criada e adicionada à sessão." });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Não foi possível criar a corrida." });
    } finally {
      setBusy(false);
    }
  }

  async function atualizarStatus() {
    if (!corrida || !proximoStatus) return;
    setBusy(true);
    setNotice(null);
    try {
      const updated = await api<Corrida>(`/corridas/${corrida.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: proximoStatus }),
      });
      setCorrida(updated);
      setNotice({ kind: "success", text: `Status alterado para ${updated.status}.` });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Não foi possível alterar o status." });
    } finally {
      setBusy(false);
    }
  }

  async function aceitarCorrida(item: Corrida) {
    setBusy(true);
    setNotice(null);
    try {
      const accepted = await api<Corrida>(`/corridas/${item.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ACEITA" }),
      });
      setCorrida(accepted);
      setIdBusca(accepted.id);
      setNotice({ kind: "success", text: "Corrida aceita e vinculada ao seu usuario." });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Falha ao aceitar a corrida." });
    } finally {
      await carregarCorridasAbertas(true);
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Corridas início"><span className="brand-mark">C</span><span>corridas<span className="brand-dot">.</span></span></a>
        <span className="env-pill"><i /> AMBIENTE DE DEMONSTRAÇÃO</span>
      </header>

      <section className="intro" id="top">
        <div>
          <p className="eyebrow">PAINEL DE OPERAÇÃO</p>
          <h1>Sua corrida,<br /><em>em movimento.</em></h1>
          <p className="lede">Acompanhe cada etapa da solicitação até a chegada.</p>
        </div>
        <div className="route-art" aria-hidden="true"><span className="route-line" /><span className="pin pin-start">A</span><span className="pin pin-end">B</span><span className="route-label label-start">ORIGEM</span><span className="route-label label-end">DESTINO</span></div>
      </section>

      <section className="token-panel">
        <div className="token-heading"><span className="step-number">01</span><div><h2>{usuario ? "Sua sessão" : modoAuth === "cadastro" ? "Crie sua conta" : "Entre na sua conta"}</h2><p>{usuario ? "Sua identidade e seu perfil foram confirmados pela API." : "Cadastre-se como passageiro ou motorista para usar o sistema."}</p></div></div>
        {usuario ? <div className="auth-session"><div><strong>{usuario.nome}</strong><span>{usuario.email} · {usuario.perfil}</span></div><button className="secondary-button" disabled={busy} onClick={sair} type="button">Sair</button></div> : <>
          <form className="auth-form" onSubmit={(event) => void autenticar(event)}>
            {modoAuth === "cadastro" && <>
              <label className="input-field"><span>Nome</span><input autoComplete="name" maxLength={100} minLength={2} required value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Seu nome" /></label>
              <div className="role-switch" role="group" aria-label="Tipo de conta">
                <button className={perfil === "passageiro" ? "selected" : ""} onClick={() => setPerfil("passageiro")} type="button">Passageiro</button>
                <button className={perfil === "motorista" ? "selected" : ""} onClick={() => setPerfil("motorista")} type="button">Motorista</button>
              </div>
            </>}
            <label className="input-field"><span>Email</span><input autoComplete="email" maxLength={320} required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" /></label>
            <label className="input-field"><span>Senha</span><input autoComplete={modoAuth === "cadastro" ? "new-password" : "current-password"} minLength={8} maxLength={128} required type="password" value={senha} onChange={(event) => setSenha(event.target.value)} placeholder="Mínimo de 8 caracteres" /></label>
            <button className="primary-button" disabled={busy} type="submit">{busy ? "Aguarde…" : modoAuth === "cadastro" ? "Criar conta" : "Entrar"} <span aria-hidden="true">↗</span></button>
          </form>
          <button className="auth-mode-switch" onClick={() => setModoAuth(modoAuth === "cadastro" ? "login" : "cadastro")} type="button">{modoAuth === "cadastro" ? "Já tem uma conta? Entrar" : "Ainda não tem conta? Criar conta"}</button>
        </>}
        {!usuario && notice && <div className={`notice ${notice.kind}`} role="status"><span>{notice.kind === "success" ? "✓" : "!"}</span>{notice.text}</div>}
      </section>

      <div className="workspace">
        <section className="card create-card">
          {perfil === "motorista" ? <>
            <div className="card-heading"><span className="step-number">02</span><div><p className="eyebrow">CORRIDAS DISPON&Iacute;VEIS</p><h2>Corridas abertas</h2></div><span className="version-tag">{corridasAbertas.length}</span></div>
            {corridasAbertas.length ? <div className="open-rides-list">{corridasAbertas.map((item) => <article className="open-ride-item" key={item.id}><div className="journey"><div className="journey-point"><span className="point-dot origin-dot" /><div><span className="summary-label">ORIGEM</span><strong>{item.origem}</strong></div></div><span className="journey-connector" /><div className="journey-point"><span className="point-dot destination-dot" /><div><span className="summary-label">DESTINO</span><strong>{item.destino}</strong></div></div></div><button className="primary-button" disabled={busy} onClick={() => void aceitarCorrida(item)} type="button">Aceitar corrida <span aria-hidden="true">→</span></button></article>)}</div> : <div className="empty-state"><strong>Nenhuma corrida aberta agora.</strong><span>Novas solicita&ccedil;&otilde;es aparecem aqui automaticamente.</span></div>}
          </> : <>
          <div className="card-heading"><span className="step-number">02</span><div><p className="eyebrow">NOVA SOLICITAÇÃO</p><h2>Para onde vamos?</h2></div></div>
          <form onSubmit={criar}>
            <label className="input-field"><span>Origem</span><input required maxLength={500} value={origem} onChange={(e) => setOrigem(e.target.value)} placeholder="Ex.: Praça XV, Centro" /></label>
            <label className="input-field"><span>Destino</span><input required maxLength={500} value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Ex.: Jardim Botânico" /></label>
            <button className="primary-button" disabled={busy || !token.trim() || perfil !== "passageiro"} type="submit">Solicitar corrida <span aria-hidden="true">↗</span></button>
            {perfil !== "passageiro" && <p className="form-hint">Selecione Passageiro para criar uma solicitação.</p>}
          </form>
          {ids.length > 0 && <div className="session-list"><div className="list-heading"><span>CRIADAS NESTA SESSÃO</span><span>{String(ids.length).padStart(2, "0")}</span></div>{ids.map((id, index) => <button className={`session-item ${id === idBusca ? "active" : ""}`} key={id} onClick={() => { setIdBusca(id); void consultar(id); }} type="button"><span className="session-index">{String(index + 1).padStart(2, "0")}</span><code>{id}</code><span className="item-arrow">↗</span></button>)}</div>}
          </>}
        </section>

        <section className="card tracking-card">
          <div className="card-heading"><span className="step-number">03</span><div><p className="eyebrow">ACOMPANHAMENTO</p><h2>Status da corrida</h2></div><span className="live-indicator"><i /> AO VIVO</span></div>
          <div className="lookup-row"><label className="input-field"><span>ID da corrida</span><input value={idBusca} onChange={(e) => setIdBusca(e.target.value)} placeholder="UUID da corrida" /></label><button className="icon-button" disabled={busy || !token.trim() || !idBusca.trim()} onClick={() => void consultar(idBusca)} aria-label="Consultar corrida" type="button">↗</button></div>
          {corrida && corrida.id === idBusca ? <>
            <div className="ride-summary"><div><span className="summary-label">CORRIDA</span><code>{corrida.id}</code></div><span className="version-tag">v{corrida.versao}</span></div>
            <div className="journey"><div className="journey-point"><span className="point-dot origin-dot" /><div><span className="summary-label">ORIGEM</span><strong>{corrida.origem}</strong></div></div><span className="journey-connector" /><div className="journey-point"><span className="point-dot destination-dot" /><div><span className="summary-label">DESTINO</span><strong>{corrida.destino}</strong></div></div></div>
            <div className="progress-track">{(["SOLICITADA", "ACEITA", "EM_ANDAMENTO", "FINALIZADA"] as const).map((status, index) => { const activeIndex = ["SOLICITADA", "ACEITA", "EM_ANDAMENTO", "FINALIZADA"].indexOf(corrida.status); return <div className={`progress-step ${index <= activeIndex ? "complete" : ""} ${index === activeIndex ? "current" : ""}`} key={status}><span className="progress-dot">{index < activeIndex ? "✓" : index + 1}</span><span>{status.replace("_", " ")}</span></div>; })}</div>
            <div className="status-footer"><div><span className="summary-label">STATUS ATUAL</span><strong className="current-status">{corrida.status.replace("_", " ")}</strong></div>{perfil === "motorista" && proximoStatus && <button className="primary-button advance-button" disabled={busy || !token.trim()} onClick={() => void atualizarStatus()} type="button">Avançar para {proximoStatus.replace("_", " ")} <span aria-hidden="true">→</span></button>}</div>
          </> : <div className="empty-state"><span className="empty-icon">↗</span><strong>Sua próxima corrida começa aqui.</strong><span>Crie uma solicitação ou informe um ID para acompanhar.</span></div>}
          {usuario && notice && <div className={`notice ${notice.kind}`} role="status"><span>{notice.kind === "success" ? "✓" : "!"}</span>{notice.text}</div>}
          <p className="polling-note"><i /> Atualização automática a cada 5 segundos</p>
        </section>
      </div>
      <footer className="footer"><span>DEMONSTRAÇÃO TÉCNICA · CORRIDAS</span><span>Feito para uma jornada mais simples <b>✳</b></span></footer>
    </main>
  );
}
