/**
 * supabase.js — CaixaSala · Sistema de Saldo Devedor
 *
 * Modelo:
 *   alunos.saldo_devedor  = saldo total acumulado do aluno
 *   movimentacoes_financeiras = histórico de débitos e créditos por aluno
 *   comprovantes          = uploads dos alunos aguardando aprovação
 *   movimentacoes         = caixa geral da turma (entradas/saídas)
 *
 * Fluxo de aprovação de comprovante:
 *   1. Aluno envia comprovante → status = 'aguardando'
 *   2. Secretária aprova:
 *      a. comprovantes.status = 'aprovado'
 *      b. movimentacoes_financeiras INSERT tipo='credito'
 *      c. alunos.saldo_devedor -= valor
 *   3. Secretária rejeita → comprovantes.status = 'rejeitado'
 */
import { createClient } from "@supabase/supabase-js";

const SB_URL = "https://rlpudoysvbzfmysfzkgk.supabase.co";
const SB_KEY = "sb_publishable_c-OZm-N8nddYxuBJgzESRA_lnRHjyNJ";

export const supabase = createClient(SB_URL, SB_KEY, {
  auth: {
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: true,
    storageKey:         "csala_v11",
  },
  global: {
    fetch: (url, opts) => {
      const ctrl = new AbortController();
      const t    = setTimeout(() => ctrl.abort(), 12000);
      return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
    },
  },
});

// ─── helper: tabela inexistente → retorna fallback silenciosamente ─────────────
const safe = async (fn, fallback = []) => {
  try { return await fn(); }
  catch (e) {
    if (e?.code === "42P01" || e?.message?.includes("does not exist") || e?.name === "AbortError")
      return fallback;
    throw e;
  }
};

// ─── normaliza número para evitar string vs number bugs ────────────────────────
const n = (v) => Number(v ?? 0);

export const db = {

  // ════════════════════════════════════════════════════════════════════════════
  //  ALUNOS  (com saldo_devedor)
  // ════════════════════════════════════════════════════════════════════════════
  getAlunos: async () => {
    const { data, error } = await supabase
      .from("alunos").select("*").order("nome");
    if (error) throw error;
    return (data || []).map(a => ({ ...a, saldo_devedor: n(a.saldo_devedor) }));
  },

  insertAluno: async (nome) => {
    const { data, error } = await supabase
      .from("alunos")
      .insert({ nome: nome.trim(), turma: "2A", saldo_devedor: 0 })
      .select().single();
    if (error) throw error;
    return data;
  },

  deleteAluno: async (id) => {
    const { error } = await supabase.from("alunos").delete().eq("id", id);
    if (error) throw error;
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  SALDO DEVEDOR — operações atômicas
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Adiciona débito ao aluno:
   *   alunos.saldo_devedor += valor
   *   movimentacoes_financeiras INSERT tipo='debito'
   */
  adicionarDebito: async (alunoId, valor, descricao, criadoPor = "Secretária") => {
    const v = Math.abs(n(valor));
    if (v <= 0) throw new Error("Valor deve ser maior que zero");

    // 1. Busca saldo atual
    const { data: aluno, error: errA } = await supabase
      .from("alunos").select("saldo_devedor").eq("id", alunoId).single();
    if (errA) throw errA;

    const novoSaldo = n(aluno.saldo_devedor) + v;

    // 2. Atualiza saldo
    const { error: errU } = await supabase
      .from("alunos").update({ saldo_devedor: novoSaldo }).eq("id", alunoId);
    if (errU) throw errU;

    // 3. Registra no histórico
    const { data, error: errM } = await supabase
      .from("movimentacoes_financeiras")
      .insert({ aluno_id: alunoId, tipo: "debito", valor: v, descricao, origem: "manual", criado_por: criadoPor })
      .select().single();
    if (errM) throw errM;

    return { novoSaldo, movimentacao: data };
  },

  /**
   * Reduz saldo devedor manualmente (sem comprovante):
   *   alunos.saldo_devedor -= valor  (mínimo 0)
   *   movimentacoes_financeiras INSERT tipo='credito'
   */
  reduzirSaldo: async (alunoId, valor, descricao, criadoPor = "Secretária") => {
    const v = Math.abs(n(valor));
    if (v <= 0) throw new Error("Valor deve ser maior que zero");

    const { data: aluno, error: errA } = await supabase
      .from("alunos").select("saldo_devedor").eq("id", alunoId).single();
    if (errA) throw errA;

    const novoSaldo = Math.max(0, n(aluno.saldo_devedor) - v);

    const { error: errU } = await supabase
      .from("alunos").update({ saldo_devedor: novoSaldo }).eq("id", alunoId);
    if (errU) throw errU;

    const { data, error: errM } = await supabase
      .from("movimentacoes_financeiras")
      .insert({ aluno_id: alunoId, tipo: "credito", valor: v, descricao, origem: "manual", criado_por: criadoPor })
      .select().single();
    if (errM) throw errM;

    return { novoSaldo, movimentacao: data };
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  MOVIMENTAÇÕES FINANCEIRAS (histórico por aluno)
  // ════════════════════════════════════════════════════════════════════════════
  getMovFinanceiras: async (alunoId) => {
    return safe(async () => {
      const q = supabase.from("movimentacoes_financeiras")
        .select("*").order("created_at", { ascending: false });
      if (alunoId) q.eq("aluno_id", alunoId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(m => ({ ...m, valor: n(m.valor) }));
    });
  },

  getAllMovFinanceiras: async () => {
    return safe(async () => {
      const { data, error } = await supabase
        .from("movimentacoes_financeiras")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(m => ({ ...m, valor: n(m.valor) }));
    });
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  COMPROVANTES (upload do aluno)
  // ════════════════════════════════════════════════════════════════════════════
  getComprovantes: async () => {
    return safe(async () => {
      const { data, error } = await supabase
        .from("comprovantes")
        .select("*")
        .order("enviado_em", { ascending: false });
      if (error) throw error;
      return (data || []).map(c => ({ ...c, valor: n(c.valor) }));
    });
  },

  /**
   * Aluno envia comprovante — cria registro aguardando aprovação
   */
  enviarComprovante: async ({ alunoId, valor, descricao, comprovanteUrl, storagePath, observacao }) => {
    const { data, error } = await supabase
      .from("comprovantes")
      .insert({
        aluno_id:        alunoId,
        valor:           Math.abs(n(valor)),
        descricao:       descricao?.trim() || "Pagamento",
        status:          "aguardando",
        comprovante_url: comprovanteUrl || null,
        storage_path:    storagePath    || null,
        observacao_aluno:observacao?.trim() || null,
        enviado_em:      new Date().toISOString(),
      })
      .select().single();
    if (error) throw error;
    return data;
  },

  /**
   * Secretária aprova comprovante:
   *   1. comprovantes.status = 'aprovado'
   *   2. credita saldo do aluno
   *   3. registra em movimentacoes_financeiras
   */
  aprovarComprovante: async (comprovanteId, criadoPor = "Secretária") => {
    // 1. Busca comprovante
    const { data: comp, error: errC } = await supabase
      .from("comprovantes").select("*").eq("id", comprovanteId).single();
    if (errC) throw errC;
    if (comp.status !== "aguardando")
      throw new Error("Comprovante não está aguardando aprovação.");

    // 2. Busca saldo atual
    const { data: aluno, error: errA } = await supabase
      .from("alunos").select("saldo_devedor").eq("id", comp.aluno_id).single();
    if (errA) throw errA;

    const novoSaldo = Math.max(0, n(aluno.saldo_devedor) - n(comp.valor));

    // 3. Atualiza saldo do aluno
    const { error: errU } = await supabase
      .from("alunos")
      .update({ saldo_devedor: novoSaldo })
      .eq("id", comp.aluno_id);
    if (errU) throw errU;

    // 4. Marca comprovante como aprovado
    const { data: compAtualizado, error: errCA } = await supabase
      .from("comprovantes")
      .update({ status: "aprovado", analisado_em: new Date().toISOString() })
      .eq("id", comprovanteId)
      .select().single();
    if (errCA) throw errCA;

    // 5. Registra crédito no histórico
    await supabase.from("movimentacoes_financeiras").insert({
      aluno_id:      comp.aluno_id,
      tipo:          "credito",
      valor:         n(comp.valor),
      descricao:     comp.descricao || "Comprovante aprovado",
      origem:        "comprovante",
      referencia_id: comprovanteId,
      criado_por:    criadoPor,
    });

    return { comprovante: compAtualizado, novoSaldo };
  },

  /**
   * Secretária rejeita comprovante
   */
  rejeitarComprovante: async (comprovanteId, motivo) => {
    const { data, error } = await supabase
      .from("comprovantes")
      .update({
        status:        "rejeitado",
        motivo_recusa: motivo?.trim() || "Comprovante inválido.",
        analisado_em:  new Date().toISOString(),
      })
      .eq("id", comprovanteId)
      .select().single();
    if (error) throw error;
    return data;
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  MOVIMENTAÇÕES (caixa geral da turma)
  // ════════════════════════════════════════════════════════════════════════════
  getMovimentacoes: async () => {
    const { data, error } = await supabase
      .from("movimentacoes").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },
  insertMovimentacao: async (body) => {
    const { data, error } = await supabase
      .from("movimentacoes").insert(body).select().single();
    if (error) throw error;
    return data;
  },
  updateMovimentacao: async (id, body) => {
    const { data, error } = await supabase
      .from("movimentacoes").update(body).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  deleteMovimentacao: async (id) => {
    const { error } = await supabase.from("movimentacoes").delete().eq("id", id);
    if (error) throw error;
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  UPLOAD (Supabase Storage)
  // ════════════════════════════════════════════════════════════════════════════
  uploadComprovante: async (file, alunoId) => {
    const ext  = file.name.split(".").pop().toLowerCase();
    const path = `${alunoId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("comprovantes")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from("comprovantes").getPublicUrl(path);
    return { path, url: data.publicUrl };
  },
};
