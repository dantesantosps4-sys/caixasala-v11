// ─── Premium Design System — CaixaSala ───────────────────────────────────────
// Paleta: Preto deep + Indigo/Violet brand + Cyan accent

export const C = {
  // ── Backgrounds ──
  bg:       "#080b12",   // base profunda
  bgB:      "#060810",   // mais escuro ainda
  surf:     "#0e1220",   // surface principal
  surfB:    "#121726",   // surface secundária
  surfC:    "#171d2f",   // surface elevada
  surfD:    "#1c2338",   // surface hover

  // ── Borders ──
  border:   "#1a2038",   // borda default
  borderB:  "#232d4a",   // borda hover
  borderH:  "#2e3d64",   // borda ativa/focus

  // ── Brand Indigo ──
  acc:      "#6366f1",
  accB:     "#4f52d4",
  accDim:   "rgba(99,102,241,.13)",
  accBdr:   "rgba(99,102,241,.28)",
  accGlow:  "rgba(99,102,241,.3)",
  accGrad:  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  accGradH: "linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)",

  // ── Purple ──
  purple:   "#8b5cf6",
  purDim:   "rgba(139,92,246,.13)",
  purBdr:   "rgba(139,92,246,.28)",
  purGrad:  "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",

  // ── Cyan accent ──
  cyan:     "#22d3ee",
  cyanDim:  "rgba(34,211,238,.11)",
  cyanBdr:  "rgba(34,211,238,.25)",

  // ── Green ──
  ok:       "#10b981",
  okDim:    "rgba(16,185,129,.12)",
  okBdr:    "rgba(16,185,129,.28)",
  okGrad:   "linear-gradient(135deg, #10b981 0%, #059669 100%)",

  // ── Amber ──
  warn:     "#f59e0b",
  warnDim:  "rgba(245,158,11,.12)",
  warnBdr:  "rgba(245,158,11,.28)",
  warnGrad: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",

  // ── Red ──
  err:      "#ef4444",
  errDim:   "rgba(239,68,68,.12)",
  errBdr:   "rgba(239,68,68,.28)",
  errGrad:  "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",

  // ── Gold ──
  gold:     "#fbbf24",
  goldDim:  "rgba(251,191,36,.12)",

  // ── Text ──
  txt:      "#e8eaf6",
  sub:      "#7b8ab8",
  muted:    "#3d4a6a",
};

export const VALOR_MENSAL_PADRAO = 15;
export const TURMA                = "2A";
export const TOTAL_ALUNOS         = 44;

export const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
export const MESES_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export const CATS_ENTRADA = {
  mensalidade: { label: "Mensalidade", color: C.acc    },
  doacao:      { label: "Doação",      color: C.ok     },
  evento:      { label: "Evento",      color: C.gold   },
  outros:      { label: "Outros",      color: C.sub    },
};
export const CATS_SAIDA = {
  evento:     { label: "Evento",     color: C.warn   },
  material:   { label: "Material",   color: C.purple },
  lanche:     { label: "Lanche",     color: "#f97316"},
  manutencao: { label: "Manutenção", color: C.cyan   },
  transporte: { label: "Transporte", color: "#06b6d4"},
  outros:     { label: "Outros",     color: C.sub    },
};
export const catInfo = (tipo, cat) =>
  (tipo === "entrada" ? CATS_ENTRADA : CATS_SAIDA)[cat] ?? { label: cat, color: C.sub };

// ─── Formatters ───────────────────────────────────────────────────────────────
export const fmt = (v) =>
  `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export const fmtDate = (d) => {
  if (!d) return "—";
  try { return new Date(d.includes("T") ? d : `${d}T12:00:00`).toLocaleDateString("pt-BR"); }
  catch { return d; }
};
export const fmtDateShort = (d) => {
  if (!d) return "—";
  try {
    const dt = new Date(d.includes("T") ? d : `${d}T12:00:00`);
    return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}`;
  } catch { return d; }
};
export const fmtDateTime = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }); }
  catch { return d; }
};
export const today   = () => new Date().toISOString().split("T")[0];
export const nowYear = () => new Date().getFullYear();
export const nowMes  = () => new Date().getMonth() + 1;

// ─── Avatar ───────────────────────────────────────────────────────────────────
export const avatarLetters = (nome = "?") =>
  nome.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase();

export const avatarColor = (nome = "") => {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) & 0xffff;
  const hue = h % 360;
  return {
    bg:     `hsl(${hue}, 40%, 18%)`,
    border: `hsl(${hue}, 52%, 38%)`,
    text:   `hsl(${hue}, 70%, 76%)`,
  };
};
