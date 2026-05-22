import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase.js";
import { C } from "../lib/utils.js";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email,   setEmail]   = useState("");
  const [pass,    setPass]    = useState("");
  const [showP,   setShowP]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const submit = async (e) => {
    e?.preventDefault();
    if (!email || !pass) { setError("Preencha email e senha."); return; }
    setLoading(true); setError("");
    const { data, error: e2 } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
    if (e2) {
      setError(e2.message.includes("Invalid") ? "Email ou senha incorretos." : e2.message);
      setLoading(false); return;
    }
    onLogin(data.user);
    toast.success("Bem-vinda! 🎉");
    navigate("/secretaria");
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "20px 16px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Glow */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", height: 350, background: `radial-gradient(ellipse at 50% 0%, ${C.accGlow} 0%, transparent 70%)`, pointerEvents: "none" }}/>

      {/* Back */}
      <button onClick={() => navigate("/")} style={{ position: "absolute", top: 20, left: 20, background: C.surfB, border: `1px solid ${C.border}`, borderRadius: 12, padding: "8px 14px", cursor: "pointer", color: C.sub, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
        <ArrowLeft size={15}/> Voltar
      </button>

      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:.35, ease:"easeOut" }}
        style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <motion.div initial={{ scale:.7 }} animate={{ scale:1 }} transition={{ type:"spring", stiffness:220, damping:14 }}
            style={{ display: "inline-flex", background: C.accGrad, borderRadius: 24, padding: "16px 18px", marginBottom: 20, boxShadow: `0 0 60px ${C.accGlow}` }}>
            <GraduationCap size={36} color="#fff"/>
          </motion.div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: C.txt, letterSpacing: "-0.03em", margin: "0 0 6px" }}>CaixaSala</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>Painel da Secretária · Turma 2A</p>
        </div>

        {/* Card */}
        <div style={{ background: C.surf, border: `1px solid ${C.border}`, borderRadius: 24, padding: "28px 24px", boxShadow: "0 24px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.04)" }}>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Email */}
            <div>
              <label style={{ color: C.sub, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, letterSpacing: ".02em" }}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.muted }}/>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="secretaria@escola.com" autoComplete="email"
                  style={{ width: "100%", background: C.surfB, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "12px 14px 12px 38px", color: C.txt, fontSize: 15, outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color .18s" }}
                  onFocus={e => e.target.style.borderColor = C.acc} onBlur={e => e.target.style.borderColor = C.border}/>
              </div>
            </div>

            {/* Senha */}
            <div>
              <label style={{ color: C.sub, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Senha</label>
              <div style={{ position: "relative" }}>
                <Lock size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.muted }}/>
                <input type={showP ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                  style={{ width: "100%", background: C.surfB, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "12px 42px 12px 38px", color: C.txt, fontSize: 15, outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color .18s" }}
                  onFocus={e => e.target.style.borderColor = C.acc} onBlur={e => e.target.style.borderColor = C.border}/>
                <button type="button" onClick={() => setShowP(p => !p)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", padding: 4 }}>
                  {showP ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: C.errDim, border: `1px solid ${C.errBdr}`, borderRadius: 12, padding: "10px 14px", color: C.err, fontSize: 13 }}>{error}</div>
            )}

            <button type="submit" disabled={loading || !email || !pass}
              style={{ background: loading || !email || !pass ? C.surfC : C.accGrad, border: "none", borderRadius: 14, padding: "14px 0", color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4, boxShadow: `0 4px 20px ${C.accGlow}`, transition: "all .2s", opacity: loading ? .7 : 1 }}>
              {loading ? <><Loader2 size={18} className="spin"/> Entrando…</> : "Entrar no Painel"}
            </button>
          </form>

          <p style={{ color: C.muted, fontSize: 12, textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
            🔒 Acesso restrito. Somente usuários cadastrados no Supabase Authentication.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
