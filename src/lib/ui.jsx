/**
 * ui.jsx — CaixaSala Premium UI Library v2
 * Nubank · PicPay · Inter · Linear aesthetic
 * Mobile-first · Dark mode · Glassmorphism
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Loader2, ChevronDown, Upload, CheckCircle,
  AlertTriangle, Info, Camera, XCircle,
} from "lucide-react";
import { C, avatarLetters, avatarColor } from "./utils.js";

// ─── BORDER RADIUS SCALE ─────────────────────────────────────────────────────
const R = { xs: 8, sm: 11, md: 14, lg: 17, xl: 22, xxl: 28, pill: 999 };

// ══════════════════════════════════════════════════════════════════════════════
//  BTN
// ══════════════════════════════════════════════════════════════════════════════
export function Btn({
  children, variant = "primary", size = "md",
  loading, disabled, full, icon: Icon,
  style, onClick, type = "button", ...rest
}) {
  const V = {
    primary: {
      bg: C.accGrad,
      color: "#fff",
      shadow: "0 2px 18px rgba(99,102,241,.32), 0 1px 4px rgba(0,0,0,.4)",
    },
    ok: {
      bg: C.okGrad,
      color: "#fff",
      shadow: "0 2px 16px rgba(16,185,129,.26), 0 1px 4px rgba(0,0,0,.4)",
    },
    err: {
      bg: C.errGrad,
      color: "#fff",
      shadow: "0 2px 12px rgba(239,68,68,.28), 0 1px 4px rgba(0,0,0,.4)",
    },
    warn: { bg: C.warnGrad, color: "#fff", shadow: "none" },
    ghost: {
      bg: "transparent",
      color: C.sub,
      border: `1.5px solid ${C.border}`,
      shadow: "none",
    },
    dark: {
      bg: C.surfC,
      color: C.sub,
      border: `1.5px solid ${C.border}`,
      shadow: "none",
    },
    subtle: {
      bg: C.accDim,
      color: C.acc,
      border: `1.5px solid ${C.accBdr}`,
      shadow: "none",
    },
    flat: { bg: C.surfB, color: C.sub, shadow: "none" },
    purple: {
      bg: C.purGrad,
      color: "#fff",
      shadow: "0 2px 16px rgba(139,92,246,.28)",
    },
  };
  const S = {
    xs: { p: "5px 12px",  fs: 11, h: 30, r: R.sm,  gap: 4 },
    sm: { p: "8px 15px",  fs: 12, h: 36, r: R.md,  gap: 5 },
    md: { p: "11px 20px", fs: 14, h: 44, r: R.lg,  gap: 7 },
    lg: { p: "13px 26px", fs: 15, h: 50, r: R.xl,  gap: 8 },
    xl: { p: "15px 30px", fs: 16, h: 56, r: R.xl,  gap: 9 },
  };
  const v = V[variant] || V.primary;
  const s = S[size]    || S.md;
  const dis = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={dis}
      whileHover={dis ? {} : { scale: 1.023, filter: "brightness(1.1)" }}
      whileTap={dis ? {} : { scale: 0.965 }}
      transition={{ duration: .13, ease: "easeOut" }}
      {...rest}
      style={{
        background: v.bg,
        color: v.color,
        border: v.border || "none",
        borderRadius: s.r,
        padding: s.p,
        fontSize: s.fs,
        fontWeight: 700,
        fontFamily: "inherit",
        letterSpacing: "-.013em",
        height: s.h,
        minHeight: s.h,
        width: full ? "100%" : undefined,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: s.gap,
        cursor: dis ? "not-allowed" : "pointer",
        opacity: dis ? 0.48 : 1,
        boxShadow: v.shadow,
        whiteSpace: "nowrap",
        userSelect: "none",
        WebkitUserSelect: "none",
        transition: "filter .13s",
        ...style,
      }}
    >
      {loading
        ? <Loader2 size={s.fs + 1} className="spin" />
        : Icon ? <Icon size={s.fs + 1} strokeWidth={2.1} /> : null
      }
      {children}
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  INPUT
// ══════════════════════════════════════════════════════════════════════════════
export function Input({ label, error, hint, icon: Icon, suffix, containerStyle, inputStyle, ...props }) {
  const [focused, setFocused] = useState(false);
  const bc = error ? C.err : focused ? C.acc : C.border;

  return (
    <div style={containerStyle}>
      {label && (
        <label style={{
          display: "block", color: C.sub, fontSize: 12, fontWeight: 600,
          marginBottom: 7, letterSpacing: ".01em",
        }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {Icon && (
          <Icon
            size={15} strokeWidth={2}
            style={{
              position: "absolute", left: 14, top: "50%",
              transform: "translateY(-50%)",
              color: focused ? C.acc : C.muted,
              pointerEvents: "none",
              transition: "color .17s",
            }}
          />
        )}
        <input
          {...props}
          onFocus={e => { setFocused(true);  props.onFocus?.(e); }}
          onBlur={e  => { setFocused(false); props.onBlur?.(e);  }}
          style={{
            width: "100%",
            background: C.surfB,
            border: `1.5px solid ${bc}`,
            borderRadius: R.lg,
            padding: "12px 14px",
            paddingLeft: Icon ? 40 : 14,
            paddingRight: suffix ? 48 : 14,
            color: C.txt,
            fontSize: 14,
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color .17s, box-shadow .17s",
            boxShadow: focused ? `0 0 0 3px ${C.acc}1a` : "none",
            ...inputStyle,
          }}
        />
        {suffix && (
          <span style={{
            position: "absolute", right: 14, top: "50%",
            transform: "translateY(-50%)", color: C.sub, fontSize: 13,
          }}>
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 5, color: C.err, fontSize: 12 }}>
          <AlertTriangle size={11} strokeWidth={2.5} />{error}
        </div>
      )}
      {hint && !error && (
        <div style={{ marginTop: 5, color: C.muted, fontSize: 12 }}>{hint}</div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  SELECT
// ══════════════════════════════════════════════════════════════════════════════
export function Select({ label, error, containerStyle, style, children, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={containerStyle}>
      {label && (
        <label style={{ display: "block", color: C.sub, fontSize: 12, fontWeight: 600, marginBottom: 7 }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <select
          {...props}
          onFocus={e => { setFocused(true);  props.onFocus?.(e); }}
          onBlur={e  => { setFocused(false); props.onBlur?.(e);  }}
          style={{
            width: "100%",
            background: C.surfB,
            border: `1.5px solid ${error ? C.err : focused ? C.acc : C.border}`,
            borderRadius: R.lg,
            padding: "12px 40px 12px 14px",
            color: C.txt,
            fontSize: 14,
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
            appearance: "none",
            cursor: "pointer",
            transition: "border-color .17s, box-shadow .17s",
            boxShadow: focused ? `0 0 0 3px ${C.acc}1a` : "none",
            ...style,
          }}
        >
          {children}
        </select>
        <ChevronDown
          size={15} strokeWidth={2}
          style={{
            position: "absolute", right: 13, top: "50%",
            transform: "translateY(-50%)",
            color: C.muted, pointerEvents: "none",
          }}
        />
      </div>
      {error && <div style={{ marginTop: 5, color: C.err, fontSize: 12 }}>{error}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  TEXTAREA
// ══════════════════════════════════════════════════════════════════════════════
export function Textarea({ label, error, style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && (
        <label style={{ display: "block", color: C.sub, fontSize: 12, fontWeight: 600, marginBottom: 7 }}>
          {label}
        </label>
      )}
      <textarea
        {...props}
        onFocus={e => { setFocused(true);  props.onFocus?.(e); }}
        onBlur={e  => { setFocused(false); props.onBlur?.(e);  }}
        style={{
          width: "100%",
          background: C.surfB,
          border: `1.5px solid ${error ? C.err : focused ? C.acc : C.border}`,
          borderRadius: R.lg,
          padding: "12px 14px",
          color: C.txt,
          fontSize: 14,
          fontFamily: "inherit",
          outline: "none",
          boxSizing: "border-box",
          resize: "vertical",
          minHeight: 84,
          lineHeight: 1.55,
          transition: "border-color .17s, box-shadow .17s",
          boxShadow: focused ? `0 0 0 3px ${C.acc}1a` : "none",
          ...style,
        }}
      />
      {error && <div style={{ marginTop: 5, color: C.err, fontSize: 12 }}>{error}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  MODAL — Bottom sheet on mobile, centered on desktop
// ══════════════════════════════════════════════════════════════════════════════
export function Modal({ open, onClose, title, subtitle, width = 520, children, footer, noPad }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: .2 }}
          onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(4, 6, 12, .82)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <motion.div
            initial={{ y: "100%", opacity: .7 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 32, stiffness: 340, mass: .85 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: C.surf,
              borderRadius: `${R.xxl}px ${R.xxl}px 0 0`,
              width: "100%",
              maxWidth: width,
              maxHeight: "92dvh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 -12px 60px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04)",
              overflow: "hidden",
            }}
          >
            {/* Handle */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, flexShrink: 0 }}>
              <div style={{ width: 38, height: 4, borderRadius: 99, background: C.border }} />
            </div>

            {/* Header */}
            <div style={{ padding: "14px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
              <div>
                <h2 style={{ color: C.txt, fontSize: 19, fontWeight: 800, margin: 0, letterSpacing: "-.025em", lineHeight: 1.25 }}>
                  {title}
                </h2>
                {subtitle && (
                  <p style={{ color: C.sub, fontSize: 13, margin: "4px 0 0", lineHeight: 1.4 }}>{subtitle}</p>
                )}
              </div>
              <motion.button
                whileTap={{ scale: .88 }}
                onClick={onClose}
                style={{
                  background: C.surfC, border: `1px solid ${C.border}`,
                  borderRadius: R.md, width: 34, height: 34,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: C.sub, flexShrink: 0, marginLeft: 14,
                  transition: "background .16s",
                }}
              >
                <X size={16} strokeWidth={2.5} />
              </motion.button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: noPad ? 0 : "20px 22px" }}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div style={{
                padding: "14px 22px",
                paddingBottom: "max(14px, env(safe-area-inset-bottom))",
                borderTop: `1px solid ${C.border}`,
                flexShrink: 0,
                background: C.surf,
              }}>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  CARD
// ══════════════════════════════════════════════════════════════════════════════
export function Card({ children, style, onClick, glow, accent, glass }) {
  return (
    <motion.div
      whileHover={onClick ? { scale: 1.01 } : {}}
      whileTap={onClick ? { scale: .985 } : {}}
      onClick={onClick}
      style={{
        background: glass
          ? "rgba(14, 18, 32, .72)"
          : C.surf,
        backdropFilter: glass ? "blur(16px)" : undefined,
        WebkitBackdropFilter: glass ? "blur(16px)" : undefined,
        border: `1px solid ${accent ? accent + "40" : C.border}`,
        borderRadius: R.xl,
        overflow: "hidden",
        cursor: onClick ? "pointer" : undefined,
        boxShadow: glow && accent
          ? `0 4px 28px ${accent}20, 0 1px 8px rgba(0,0,0,.3)`
          : "0 1px 12px rgba(0,0,0,.28)",
        position: "relative",
        transition: "box-shadow .2s",
        ...style,
      }}
    >
      {accent && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent, opacity: .75, borderRadius: `${R.xl}px ${R.xl}px 0 0` }} />
      )}
      {children}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  AVATAR
// ══════════════════════════════════════════════════════════════════════════════
export function Avatar({ nome, size = 38 }) {
  const { bg, border: bd, text } = avatarColor(nome || "");
  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.round(size * .28),
      background: bg,
      border: `1.5px solid ${bd}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * .37), fontWeight: 800, color: text,
      flexShrink: 0, letterSpacing: "-.01em", userSelect: "none",
    }}>
      {avatarLetters(nome || "?")}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  STATUS BADGE
// ══════════════════════════════════════════════════════════════════════════════
const ST_V = {
  pago:                 { l: "EM DIA",    c: "#10b981", bg: "rgba(16,185,129,.12)",  bd: "rgba(16,185,129,.28)"  },
  pendente:             { l: "PENDENTE",  c: "#f59e0b", bg: "rgba(245,158,11,.12)",  bd: "rgba(245,158,11,.28)"  },
  atrasado:             { l: "ATRASADO",  c: "#ef4444", bg: "rgba(239,68,68,.12)",   bd: "rgba(239,68,68,.28)"   },
  aguardando_aprovacao: { l: "AGUARDANDO",c: "#6366f1", bg: "rgba(99,102,241,.12)",  bd: "rgba(99,102,241,.28)"  },
  aprovado:             { l: "APROVADO",  c: "#10b981", bg: "rgba(16,185,129,.12)",  bd: "rgba(16,185,129,.28)"  },
  rejeitado:            { l: "RECUSADO",  c: "#ef4444", bg: "rgba(239,68,68,.12)",   bd: "rgba(239,68,68,.28)"   },
  sem:                  { l: "PENDENTE",  c: "#f59e0b", bg: "rgba(245,158,11,.12)",  bd: "rgba(245,158,11,.28)"  },
};
export function SBadge({ status, size = "sm" }) {
  const v = ST_V[status] || ST_V.sem;
  const Icon = status === "pago" || status === "aprovado"
    ? CheckCircle
    : status === "atrasado" || status === "rejeitado"
      ? AlertTriangle
      : status === "aguardando_aprovacao"
        ? Info
        : Info;
  const fs = size === "sm" ? 9 : 11;
  return (
    <span style={{
      background: v.bg, color: v.c, border: `1px solid ${v.bd}`,
      padding: size === "sm" ? "3px 9px" : "4px 12px",
      borderRadius: R.pill, fontSize: fs, fontWeight: 800,
      display: "inline-flex", alignItems: "center", gap: 4,
      whiteSpace: "nowrap", letterSpacing: ".045em",
    }}>
      <Icon size={fs} strokeWidth={2.5} />{v.l}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  KPI CARD
// ══════════════════════════════════════════════════════════════════════════════
export function KPICard({ icon: Icon, label, value, sub, color, gradient, onClick, style, small }) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: `0 8px 32px ${color}28` }}
      whileTap={onClick ? { scale: .96 } : {}}
      onClick={onClick}
      transition={{ duration: .2 }}
      style={{
        background: C.surf,
        border: `1px solid ${C.border}`,
        borderRadius: R.xl,
        padding: small ? "16px 16px 14px" : "20px 18px 16px",
        position: "relative",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        boxShadow: "0 1px 12px rgba(0,0,0,.28)",
        ...style,
      }}
    >
      {/* top accent */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: gradient || color, opacity: .8, borderRadius: `${R.xl}px ${R.xl}px 0 0` }} />
      {/* glow blob */}
      <div style={{ position: "absolute", top: -28, right: -28, width: 88, height: 88, background: color + "18", borderRadius: "50%", filter: "blur(18px)", pointerEvents: "none" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: small ? 12 : 14, position: "relative" }}>
        <div style={{ background: color + "1d", borderRadius: R.md, padding: small ? 8 : 10, display: "inline-flex" }}>
          <Icon size={small ? 16 : 19} strokeWidth={2} color={color} />
        </div>
      </div>

      <div style={{ fontSize: small ? 22 : 26, fontWeight: 900, color: C.txt, letterSpacing: "-.03em", lineHeight: 1, position: "relative" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 5, fontWeight: 500, position: "relative" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 700, position: "relative" }}>{sub}</div>}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  PROGRESS BAR
// ══════════════════════════════════════════════════════════════════════════════
export function ProgressBar({ value, max, color = C.acc, height = 7, showLabel, label }) {
  const pct = max > 0 ? Math.min(100, Math.round(value / max * 100)) : 0;
  return (
    <div>
      {(showLabel || label) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, fontSize: 12 }}>
          <span style={{ color: C.sub }}>{label || `${value} de ${max}`}</span>
          <span style={{ color, fontWeight: 700 }}>{pct}%</span>
        </div>
      )}
      <div style={{ height, background: C.border, borderRadius: R.pill, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.3, ease: "easeOut" }}
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            borderRadius: R.pill,
          }}
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  SKELETON
// ══════════════════════════════════════════════════════════════════════════════
export function Skeleton({ w = "100%", h = 16, r = 9, style }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

export function SkeletonCard() {
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <Skeleton w={44} h={44} r={14} />
        <div style={{ flex: 1 }}>
          <Skeleton h={14} r={6} style={{ marginBottom: 8 }} />
          <Skeleton w="55%" h={11} r={6} />
        </div>
      </div>
      <Skeleton h={26} r={8} style={{ marginBottom: 8 }} />
      <Skeleton w="65%" h={11} r={6} />
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  EMPTY STATE
// ══════════════════════════════════════════════════════════════════════════════
export function Empty({ icon: Icon, title, desc, action }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "52px 24px" }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: C.surfC,
        border: `1px solid ${C.border}`,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        marginBottom: 18,
      }}>
        <Icon size={28} strokeWidth={1.5} color={C.muted} />
      </div>
      <div style={{ color: C.sub, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {desc && <div style={{ color: C.muted, fontSize: 13, maxWidth: 288, margin: "0 auto 22px", lineHeight: 1.65 }}>{desc}</div>}
      {action}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  ALERT BANNER
// ══════════════════════════════════════════════════════════════════════════════
export function Alert({ type = "info", children, style }) {
  const M = {
    info: { c: C.acc,  bg: C.accDim,  bd: C.accBdr,  I: Info          },
    ok:   { c: C.ok,   bg: C.okDim,   bd: C.okBdr,   I: CheckCircle   },
    warn: { c: C.warn, bg: C.warnDim, bd: C.warnBdr, I: AlertTriangle },
    err:  { c: C.err,  bg: C.errDim,  bd: C.errBdr,  I: AlertTriangle },
  };
  const m = M[type] || M.info;
  return (
    <div style={{
      background: m.bg, border: `1px solid ${m.bd}`,
      borderRadius: R.lg, padding: "12px 15px",
      display: "flex", gap: 11, alignItems: "flex-start",
      ...style,
    }}>
      <m.I size={16} strokeWidth={2} color={m.c} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ color: m.c, fontSize: 13, lineHeight: 1.55 }}>{children}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  SECTION HEADER
// ══════════════════════════════════════════════════════════════════════════════
export function SectionHeader({ title, sub, right, style }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", ...style }}>
      <div>
        <h3 style={{ color: C.txt, fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: "-.022em" }}>
          {title}
        </h3>
        {sub && <p style={{ color: C.muted, fontSize: 13, margin: "4px 0 0" }}>{sub}</p>}
      </div>
      {right && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {right}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  FILE UPLOAD AREA
// ══════════════════════════════════════════════════════════════════════════════
export function FileUpload({ onFile, label, hint, accept = "image/*,application/pdf" }) {
  const ref      = useRef();
  const [drag,   setDrag]    = useState(false);
  const [file,   setFile]    = useState(null);
  const [preview,setPreview] = useState(null);

  const handle = (f) => {
    if (!f) return;
    setFile(f);
    onFile?.(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  return (
    <div>
      {label && (
        <label style={{ display: "block", color: C.sub, fontSize: 12, fontWeight: 600, marginBottom: 7 }}>
          {label}
        </label>
      )}
      <motion.div
        animate={{ borderColor: drag ? C.acc : C.border, background: drag ? C.accDim : C.surfB }}
        transition={{ duration: .16 }}
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true);  }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
        style={{
          border: `2px dashed ${drag ? C.acc : C.border}`,
          borderRadius: R.xl, padding: "22px 16px",
          textAlign: "center", cursor: "pointer",
          position: "relative", overflow: "hidden",
        }}
      >
        <input
          ref={ref} type="file" accept={accept} style={{ display: "none" }}
          onChange={e => handle(e.target.files?.[0])}
        />

        {preview ? (
          <div>
            <img src={preview} alt="preview" style={{ maxHeight: 170, maxWidth: "100%", borderRadius: R.lg, objectFit: "contain" }} />
            <div style={{ color: C.ok, fontSize: 12, fontWeight: 700, marginTop: 10 }}>✓ {file.name}</div>
            <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{(file.size / 1024).toFixed(0)} KB</div>
          </div>
        ) : file ? (
          <div>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: C.accDim, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Upload size={24} strokeWidth={1.5} color={C.acc} />
            </div>
            <div style={{ color: C.ok, fontSize: 13, fontWeight: 700 }}>✓ {file.name}</div>
            <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{(file.size / 1024).toFixed(0)} KB</div>
          </div>
        ) : (
          <div>
            <motion.div
              animate={{ scale: drag ? 1.1 : 1 }}
              style={{ width: 56, height: 56, borderRadius: 18, background: drag ? C.accDim : C.surfC, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}
            >
              <Camera size={26} strokeWidth={1.4} color={drag ? C.acc : C.muted} />
            </motion.div>
            <div style={{ color: drag ? C.acc : C.sub, fontSize: 14, fontWeight: 600 }}>
              {drag ? "Solte aqui!" : "Toque para enviar foto ou PDF"}
            </div>
            {hint && <div style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>{hint}</div>}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  DIVIDER
// ══════════════════════════════════════════════════════════════════════════════
export function Divider({ style }) {
  return <div style={{ height: 1, background: C.border, ...style }} />;
}

// ══════════════════════════════════════════════════════════════════════════════
//  CONFIRM DIALOG
// ══════════════════════════════════════════════════════════════════════════════
export function ConfirmDialog({ open, onClose, onConfirm, title, message, loading, confirmLabel = "Confirmar", confirmVariant = "err" }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width={420}
      footer={
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" full onClick={onClose}>Cancelar</Btn>
          <Btn variant={confirmVariant} full loading={loading} onClick={onConfirm}>{confirmLabel}</Btn>
        </div>
      }
    >
      <p style={{ color: C.sub, fontSize: 14, lineHeight: 1.72, margin: 0, whiteSpace: "pre-line" }}>{message}</p>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  QUICK ACTION BUTTON
// ══════════════════════════════════════════════════════════════════════════════
export function QuickAction({ icon: Icon, label, color, onClick, disabled }) {
  return (
    <motion.button
      type="button" onClick={onClick} disabled={disabled}
      whileHover={{ scale: 1.04, boxShadow: `0 4px 20px ${color}22` }}
      whileTap={{ scale: .92 }}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 9,
        background: C.surf,
        border: `1px solid ${C.border}`,
        borderRadius: R.xl, padding: "17px 12px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? .48 : 1,
        fontFamily: "inherit", width: "100%",
        transition: "border-color .18s",
      }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.borderColor = color + "55")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
    >
      <div style={{ width: 46, height: 46, borderRadius: 15, background: color + "1e", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={21} strokeWidth={2} color={color} />
      </div>
      <span style={{ color: C.sub, fontSize: 12, fontWeight: 600, textAlign: "center", lineHeight: 1.35 }}>{label}</span>
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  SPINNER / PAGE LOADER
// ══════════════════════════════════════════════════════════════════════════════
export function Spinner({ size = 30, color = C.acc }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2.5px solid ${color}30`,
      borderTopColor: color,
      borderRadius: "50%",
      flexShrink: 0,
    }} className="spin" />
  );
}

export function PageLoader({ label = "Carregando…" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", gap: 18 }}>
      <Spinner size={36} />
      <span style={{ color: C.muted, fontSize: 13 }}>{label}</span>
    </div>
  );
}
