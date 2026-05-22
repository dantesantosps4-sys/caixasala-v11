import jsPDF from "jspdf";

// ─── Paleta dark para PDF ─────────────────────────────────────────────────────
const P = {
  bg:     [7,   9,  14],
  surf:  [15,  17,  23],
  surfB: [19,  22,  31],
  border:[26,  32,  48],
  acc:   [59, 130, 246],
  ok:    [16, 185, 129],
  warn: [245, 158,  11],
  err:  [239,  68,  68],
  gold: [251, 191,  36],
  txt:  [221, 228, 240],
  sub:  [138, 151, 180],
  muted:[77,   90, 119],
};

const fmt   = v => `R$ ${Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}`;
const fmtD  = d => { if(!d) return "—"; try { return new Date(d.includes("T")?d:d+"T12:00:00").toLocaleDateString("pt-BR"); } catch { return d; } };
const today = () => new Date().toLocaleString("pt-BR");

export async function gerarRelatorio({ movimentacoes, cobrancas, alunos, pagamentos, userEmail }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const pad = 16;
  let y = 0;

  // ── helpers ─────────────────────────────────────────────────────────────────
  const fill = (color) => doc.setFillColor(...color);
  const draw = (color) => doc.setDrawColor(...color);
  const text = (color) => doc.setTextColor(...color);
  const font = (size, style="normal") => { doc.setFontSize(size); doc.setFont("helvetica", style); };

  const box = (x, yr, w, h, color, radius=2) => {
    fill(color);
    doc.roundedRect(x, yr, w, h, radius, radius, "F");
  };

  const txt = (str, x, yr, size=10, color=P.txt, align="left", style="normal") => {
    font(size, style);
    text(color);
    doc.text(String(str||""), x, yr, { align });
  };

  const line = (x1, y1, x2, y2, color=P.border) => {
    draw(color); doc.setLineWidth(0.2); doc.line(x1, y1, x2, y2);
  };

  const newPage = () => {
    doc.addPage();
    fill(P.bg); doc.rect(0, 0, W, 297, "F");
    y = 20;
  };

  const checkPage = (needed=20) => { if (y + needed > 278) newPage(); };

  // ── Dados computados ─────────────────────────────────────────────────────────
  const movs = movimentacoes || [];
  const cobs = cobrancas || [];
  const als  = alunos || [];
  const pgts = pagamentos || [];

  const totalEnt = movs.filter(m=>m.tipo==="entrada").reduce((a,m)=>a+Number(m.valor),0);
  const totalSai = movs.filter(m=>m.tipo==="saida").reduce((a,m)=>a+Number(m.valor),0);
  const saldo    = totalEnt - totalSai;
  const cobAtiva = cobs.find(c=>c.ativa);
  const pagosAtivos = cobAtiva ? pgts.filter(p=>p.cobranca_id===cobAtiva.id && p.status==="aprovado") : [];
  const N = als.length;
  const inadimplentes = cobAtiva
    ? als.filter(a => !pgts.some(p=>p.aluno_id===a.id && p.cobranca_id===cobAtiva.id && p.status==="aprovado"))
    : [];

  // ── PÁGINA 1: CAPA ───────────────────────────────────────────────────────────
  fill(P.bg); doc.rect(0, 0, W, 297, "F");

  // Header band
  box(0, 0, W, 58, P.surf, 0);

  // Accent stripe
  box(0, 0, 5, 58, P.acc, 0);

  // Logo / título
  txt("CaixaSala", pad + 10, 24, 26, P.acc, "left", "bold");
  txt("Sistema Financeiro Escolar", pad + 10, 33, 11, P.sub);
  txt("Turma 2A · 2024", pad + 10, 41, 9, P.muted);

  // Data geração (direita)
  txt("Relatório Financeiro Completo", W - pad, 24, 10, P.sub, "right", "bold");
  txt(`Gerado em: ${today()}`, W - pad, 33, 8, P.muted, "right");
  txt(`Por: ${userEmail || "Secretária"}`, W - pad, 41, 8, P.muted, "right");

  y = 70;

  // ── KPI cards (2×3) ───────────────────────────────────────────────────────────
  const kpis = [
    ["Saldo Atual",        fmt(saldo),          saldo>=0?P.acc:P.err],
    ["Total Arrecadado",   fmt(totalEnt),        P.ok],
    ["Total Gasto",        fmt(totalSai),        P.err],
    ["Alunos Pagos",       `${pagosAtivos.length} / ${N}`, P.gold],
    ["Inadimplentes",      String(inadimplentes.length),   P.warn],
    ["% Adimplência",      N ? `${Math.round(pagosAtivos.length/N*100)}%` : "—", P.acc],
  ];

  const kW = (W - pad*2 - 10) / 3;
  const kH = 26;

  kpis.forEach(([label, value, color], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const kx = pad + col * (kW + 5);
    const ky = y + row * (kH + 5);

    box(kx, ky, kW, kH, P.surfB, 3);
    draw(color); doc.setLineWidth(0.4);
    doc.roundedRect(kx, ky, kW, kH, 3, 3, "S");

    txt(label, kx + 4, ky + 9, 7, P.muted);
    txt(value, kx + 4, ky + 20, 11, color, "left", "bold");
  });

  y += 2 * kH + 5 + 14;

  // ── Carnê ativo ───────────────────────────────────────────────────────────────
  if (cobAtiva) {
    box(pad, y, W - pad*2, 18, P.surfB, 3);
    draw(P.acc); doc.setLineWidth(0.3); doc.roundedRect(pad, y, W-pad*2, 18, 3, 3, "S");
    txt("CARNÊ ATIVO", pad+5, y+7, 7, P.acc, "left", "bold");
    txt(cobAtiva.titulo, pad+5, y+14, 10, P.txt, "left", "bold");
    txt(`Valor: ${fmt(cobAtiva.valor)}`, pad+70, y+14, 9, P.gold);
    txt(`Vencimento: ${fmtD(cobAtiva.prazo)}`, pad+110, y+14, 9, P.sub);
    txt(`${pagosAtivos.length}/${N} pagos`, W-pad-4, y+14, 9, P.ok, "right", "bold");
    y += 26;

    // barra de progresso
    box(pad, y, W-pad*2, 4, P.border, 2);
    const pct = N > 0 ? (pagosAtivos.length/N) : 0;
    if (pct > 0) { box(pad, y, (W-pad*2)*pct, 4, P.ok, 2); }
    y += 12;
  }

  // ── Linha separadora ─────────────────────────────────────────────────────────
  line(pad, y, W-pad, y, P.border); y += 8;

  // ── SEÇÃO: Histórico Financeiro ───────────────────────────────────────────────
  txt("HISTÓRICO FINANCEIRO", pad, y, 9, P.acc, "left", "bold"); y += 7;

  // Cabeçalho tabela
  box(pad, y, W-pad*2, 8, P.surfB, 0);
  const cols = { data:pad+3, desc:pad+22, tipo:pad+100, cat:pad+122, valor:W-pad-3 };
  txt("DATA",      cols.data,  y+5.5, 7, P.muted, "left",  "bold");
  txt("DESCRIÇÃO", cols.desc,  y+5.5, 7, P.muted, "left",  "bold");
  txt("TIPO",      cols.tipo,  y+5.5, 7, P.muted, "left",  "bold");
  txt("CATEGORIA", cols.cat,   y+5.5, 7, P.muted, "left",  "bold");
  txt("VALOR",     cols.valor, y+5.5, 7, P.muted, "right", "bold");
  y += 9;

  const movsToShow = movs.slice(0, 45);
  movsToShow.forEach((m, i) => {
    checkPage(8);
    if (i % 2 === 0) box(pad, y-0.5, W-pad*2, 7.5, [10, 13, 20], 0);

    const isEnt = m.tipo === "entrada";
    txt(fmtD(m.data),                            cols.data,  y+4.5, 7, P.sub);
    txt(String(m.descricao||"").slice(0,36),     cols.desc,  y+4.5, 7, P.txt);
    txt(isEnt ? "+ Entrada" : "– Saída",          cols.tipo,  y+4.5, 7, isEnt ? P.ok : P.err);
    txt(m.categoria||"geral",                    cols.cat,   y+4.5, 7, P.sub);
    txt((isEnt?"+":"-")+" "+fmt(m.valor),        cols.valor, y+4.5, 7, isEnt?P.ok:P.err, "right", "bold");
    y += 7.5;
  });

  if (movs.length > 45) {
    txt(`... e mais ${movs.length - 45} registros omitidos`, pad, y+5, 7, P.muted);
    y += 9;
  }

  y += 5; checkPage(16);
  line(pad, y, W-pad, y, P.border); y += 10;

  // ── SEÇÃO: Resumo por categoria ──────────────────────────────────────────────
  txt("GASTOS POR CATEGORIA", pad, y, 9, P.acc, "left", "bold"); y += 7;

  const catMap = {};
  movs.filter(m=>m.tipo==="saida").forEach(m => {
    if (!catMap[m.categoria]) catMap[m.categoria] = 0;
    catMap[m.categoria] += Number(m.valor);
  });

  const cats = Object.entries(catMap).sort((a,b) => b[1]-a[1]);
  if (cats.length === 0) {
    txt("Nenhuma saída registrada.", pad, y+5, 8, P.muted); y += 12;
  } else {
    cats.forEach(([cat, val]) => {
      checkPage(8);
      const pct = totalSai > 0 ? val / totalSai : 0;
      box(pad, y, W-pad*2, 7, P.surfB, 1);
      txt(cat, pad+4, y+5, 8, P.txt);
      txt(fmt(val), W-pad-3, y+5, 8, P.err, "right", "bold");
      // mini barra
      const bx = pad + 50, bw = 60;
      box(bx, y+2.5, bw, 2, P.border, 1);
      if (pct > 0) box(bx, y+2.5, bw*pct, 2, P.err, 1);
      txt(`${Math.round(pct*100)}%`, bx+bw+3, y+5, 7, P.muted);
      y += 8;
    });
  }

  y += 4; checkPage(16);
  line(pad, y, W-pad, y, P.border); y += 10;

  // ── PÁGINA 2+: Pagamentos ────────────────────────────────────────────────────
  if (cobAtiva) {
    checkPage(30);

    txt(`PAGAMENTOS — ${cobAtiva.titulo}`, pad, y, 9, P.acc, "left", "bold");
    txt(`Valor: ${fmt(cobAtiva.valor)} · Venc: ${fmtD(cobAtiva.prazo)}`, pad, y+7, 8, P.sub);
    y += 16;

    // ─ Pagos
    const pagosC = pgts.filter(p=>p.cobranca_id===cobAtiva.id && p.status==="aprovado");
    if (pagosC.length > 0) {
      checkPage(12);
      box(pad, y, W-pad*2, 8, [8, 28, 20], 2);
      txt(`✓ PAGOS (${pagosC.length})`, pad+4, y+5.5, 8, P.ok, "left", "bold");
      y += 9;

      pagosC.forEach((p, i) => {
        checkPage(8);
        const al = als.find(a=>a.id===p.aluno_id);
        if (i%2===0) box(pad, y-0.5, W-pad*2, 7.5, [8, 22, 16], 0);
        txt(al?.nome || "?", pad+4, y+4.5, 8, P.txt);
        txt(fmtD(p.data_aprovacao), W-pad-30, y+4.5, 7, P.sub, "right");
        txt(fmt(p.valor), W-pad-3, y+4.5, 8, P.ok, "right", "bold");
        y += 7.5;
      });
      y += 6;
    }

    // ─ Pendentes (aguardando)
    const pendentesC = pgts.filter(p=>p.cobranca_id===cobAtiva.id && p.status==="pendente");
    if (pendentesC.length > 0) {
      checkPage(12);
      box(pad, y, W-pad*2, 8, [28, 22, 5], 2);
      txt(`⏳ AGUARDANDO APROVAÇÃO (${pendentesC.length})`, pad+4, y+5.5, 8, P.warn, "left", "bold");
      y += 9;

      pendentesC.forEach((p, i) => {
        checkPage(8);
        const al = als.find(a=>a.id===p.aluno_id);
        if (i%2===0) box(pad, y-0.5, W-pad*2, 7.5, [22, 18, 5], 0);
        txt(al?.nome || "?", pad+4, y+4.5, 8, P.txt);
        txt(fmtD(p.data_envio), W-pad-30, y+4.5, 7, P.sub, "right");
        txt(fmt(p.valor), W-pad-3, y+4.5, 8, P.warn, "right", "bold");
        y += 7.5;
      });
      y += 6;
    }

    // ─ Inadimplentes
    if (inadimplentes.length > 0) {
      checkPage(12);
      box(pad, y, W-pad*2, 8, [28, 10, 10], 2);
      txt(`⚠ INADIMPLENTES (${inadimplentes.length})`, pad+4, y+5.5, 8, P.err, "left", "bold");
      y += 9;

      inadimplentes.forEach((a, i) => {
        checkPage(8);
        if (i%2===0) box(pad, y-0.5, W-pad*2, 7.5, [22, 8, 8], 0);
        txt(a.nome, pad+4, y+4.5, 8, P.txt);
        txt(fmt(cobAtiva.valor), W-pad-3, y+4.5, 8, P.err, "right", "bold");
        y += 7.5;
      });
      y += 6;
    }
  }

  // ── Rodapé em todas as páginas ───────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    box(0, 284, W, 13, P.surf, 0);
    line(0, 284, W, 284, P.border);
    txt("CaixaSala — Sistema Financeiro Escolar · Turma 2A", pad, 291, 7, P.muted);
    txt(`Gerado em ${today()}`, W/2, 291, 7, P.muted, "center");
    txt(`Página ${p} / ${totalPages}`, W-pad, 291, 7, P.muted, "right");
  }

  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`caixasala-relatorio-${dateStr}.pdf`);

  return `caixasala-relatorio-${dateStr}.pdf`;
}
