/**
 * App.jsx — CaixaSala · Saldo Devedor
 * ErrorBoundary + hook de dados global limpo (sem lógica de mês)
 */
import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { supabase, db } from "./lib/supabase.js";
import Login      from "./components/Login.jsx";
import PublicPage from "./components/PublicPage.jsx";
import Secretaria from "./components/Secretaria.jsx";

// ─── Error Boundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(err) { return { error: err }; }
  componentDidCatch(err, info) { console.error("[CaixaSala]", err, info); }
  render() {
    if (this.state.error) return (
      <div style={{ minHeight:"100vh", background:"#080b12", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Inter,system-ui,sans-serif", padding:24 }}>
        <div style={{ textAlign:"center", maxWidth:380 }}>
          <div style={{ fontSize:44, marginBottom:16 }}>⚠️</div>
          <div style={{ color:"#e8eaf6", fontWeight:700, fontSize:18, marginBottom:8 }}>Algo deu errado</div>
          <div style={{ color:"#5a6680", fontSize:13, marginBottom:24, lineHeight:1.65 }}>{this.state.error?.message}</div>
          <button onClick={() => window.location.reload()}
            style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", border:"none", borderRadius:12, padding:"11px 26px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            Recarregar
          </button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

// ─── Hook global de dados ────────────────────────────────────────────────────
export function useAppData() {
  const [alunos,        setAlunos]  = useState([]);
  const [movs,          setMovs]    = useState([]);
  const [movFinanceiras,setMovFin]  = useState([]);
  const [comprovantes,  setComps]   = useState([]);
  const [loading,       setLoad]    = useState(true);
  const [dbError,       setErr]     = useState(null);

  const loadAll = useCallback(async () => {
    setLoad(true);
    setErr(null);
    try {
      const [a, m, mf, c] = await Promise.all([
        db.getAlunos(),
        db.getMovimentacoes(),
        db.getAllMovFinanceiras(),
        db.getComprovantes(),
      ]);
      setAlunos(a   || []);
      setMovs(m     || []);
      setMovFin(mf  || []);
      setComps(c    || []);
    } catch (e) {
      console.error("[CaixaSala] loadAll:", e);
      setErr(e.message || "Erro ao carregar dados");
    } finally {
      setLoad(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Realtime
  useEffect(() => {
    const ch = supabase.channel("rt-csala-v11");
    ["alunos","movimentacoes","movimentacoes_financeiras","comprovantes"]
      .forEach(t => ch.on("postgres_changes", { event:"*", schema:"public", table:t }, loadAll));
    ch.subscribe();
    return () => supabase.removeChannel(ch);
  }, [loadAll]);

  return { alunos, movs, movFinanceiras, comprovantes, loading, dbError, reload: loadAll };
}

// ─── Guard de autenticação ───────────────────────────────────────────────────
function Guard({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ─── Boot loader ─────────────────────────────────────────────────────────────
function BootLoader() {
  return (
    <div style={{ background:"#080b12", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Inter,system-ui,sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:40, height:40, border:"3px solid rgba(99,102,241,.22)", borderTopColor:"#6366f1", borderRadius:"50%", margin:"0 auto 16px", animation:"spin .75s linear infinite" }}/>
        <div style={{ color:"#3d4a6a", fontSize:14 }}>CaixaSala · Conectando…</div>
      </div>
    </div>
  );
}

// ─── Inner App (dentro do Router) ────────────────────────────────────────────
function AppInner() {
  const [user,  setUser]  = useState(null);
  const [ready, setReady] = useState(false);
  const navigate          = useNavigate();
  const appData           = useAppData();

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data }) => setUser(data?.session?.user ?? null))
      .catch(() => {})
      .finally(() => setReady(true));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  if (!ready) return <BootLoader />;

  return (
    <Routes>
      <Route path="/"           element={<PublicPage data={appData} />} />
      <Route path="/login"      element={user ? <Navigate to="/secretaria" replace /> : <Login onLogin={setUser} />} />
      <Route path="/secretaria" element={<Guard user={user}><Secretaria user={user} onLogout={async () => { await supabase.auth.signOut(); navigate("/"); }} data={appData} /></Guard>} />
      <Route path="*"           element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <ErrorBoundary><AppInner /></ErrorBoundary>;
}
