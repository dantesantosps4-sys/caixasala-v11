/**
 * Secretaria.jsx — Painel Administrativo CaixaSala
 * Modelo: Saldo Devedor por aluno (caderneta)
 * Hooks: TODOS antes de qualquer return condicional ✅
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  LayoutDashboard, Users, Wallet, CheckCircle,
  LogOut, RefreshCw, Bell, GraduationCap,
  TrendingUp, TrendingDown, AlertTriangle, Plus,
  Trash2, Edit3, Eye, Search, ChevronRight,
  Info, Loader2, DollarSign, UserX, UserCheck, Clock,
  ArrowUp, ArrowDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { db } from "../lib/supabase.js";
import {
  C, TURMA, TOTAL_ALUNOS,
  fmt, fmtDate, fmtDateShort, fmtDateTime, today,
  avatarLetters, avatarColor, catInfo, CATS_ENTRADA, CATS_SAIDA, MESES_SHORT,
} from "../lib/utils.js";
import {
  Btn, Modal, Input, Select, Textarea, Card,
  KPICard, Avatar, Empty, Alert, SectionHeader,
  ProgressBar, ConfirmDialog, Divider, QuickAction, Spinner, PageLoader,
} from "../lib/ui.jsx";

const NAV = [
  { id:"dashboard",  label:"Início",     icon:LayoutDashboard },
  { id:"alunos",     label:"Alunos",     icon:Users           },
  { id:"caixa",      label:"Caixa",      icon:Wallet          },
  { id:"aprovacoes", label:"Aprovações", icon:CheckCircle     },
];

// ─── Modal Movimentação Caixa ────────────────────────────────────────────────
function ModalMovimentacao({ open, onClose, editando, onSalvo }) {
  const [tipo,       setTipo]   = useState("entrada");
  const [valor,      setValor]  = useState("");
  const [categoria,  setCat]    = useState("geral");
  const [descricao,  setDesc]   = useState("");
  const [data,       setData]   = useState(today());
  const [responsavel,setResp]   = useState("Secretária");
  const [saving,     setSaving] = useState(false);
  const [errs,       setErrs]   = useState({});

  useEffect(() => {
    if (editando) {
      setTipo(editando.tipo); setValor(String(editando.valor));
      setCat(editando.categoria||"geral"); setDesc(editando.descricao);
      setData(editando.data); setResp(editando.responsavel||"Secretária");
    } else {
      setTipo("entrada"); setValor(""); setCat("geral");
      setDesc(""); setData(today()); setResp("Secretária");
    }
    setErrs({});
  }, [editando, open]);

  const salvar = async () => {
    const e = {};
    if (!valor || Number(valor) <= 0) e.valor = "Valor inválido";
    if (!descricao.trim()) e.descricao = "Descrição obrigatória";
    setErrs(e); if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const body = { tipo, valor:Number(Number(valor).toFixed(2)), categoria, descricao:descricao.trim(), data, responsavel:responsavel||"Secretária" };
      if (editando) { await db.updateMovimentacao(editando.id, body); toast.success("Movimentação atualizada!"); }
      else { await db.insertMovimentacao(body); toast.success(tipo==="entrada"?"✅ Entrada registrada!":"💸 Saída registrada!"); }
      onSalvo?.(); onClose();
    } catch(e) { toast.error("Erro: "+e.message); }
    setSaving(false);
  };

  const cats = Object.entries(tipo==="entrada"?CATS_ENTRADA:CATS_SAIDA);

  return (
    <Modal open={open} onClose={onClose} width={520}
      title={editando?"Editar Movimentação":tipo==="entrada"?"Registrar Entrada":"Registrar Saída"}
      footer={<div style={{display:"flex",gap:10}}><Btn variant="ghost" full onClick={onClose}>Cancelar</Btn><Btn variant={tipo==="entrada"?"ok":"err"} full loading={saving} onClick={salvar}>{saving?"Salvando…":editando?"Salvar":tipo==="entrada"?"Registrar Entrada":"Registrar Saída"}</Btn></div>}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {!editando && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {["entrada","saida"].map(t=>(
              <button key={t} type="button" onClick={()=>setTipo(t)}
                style={{padding:"11px 0",borderRadius:13,fontWeight:700,fontFamily:"inherit",fontSize:14,cursor:"pointer",border:`1.5px solid ${tipo===t?(t==="entrada"?C.ok:C.err):C.border}`,background:tipo===t?(t==="entrada"?C.okDim:C.errDim):C.surfB,color:tipo===t?(t==="entrada"?C.ok:C.err):C.sub,display:"flex",alignItems:"center",justifyContent:"center",gap:7,transition:"all .18s"}}>
                {t==="entrada"?<TrendingUp size={15}/>:<TrendingDown size={15}/>}
                {t==="entrada"?"Entrada":"Saída"}
              </button>
            ))}
          </div>
        )}
        <Input label="Valor (R$)" type="number" min="0.01" step="0.01" placeholder="0,00" value={valor} onChange={e=>setValor(e.target.value)} error={errs.valor} icon={DollarSign}/>
        <Select label="Categoria" value={categoria} onChange={e=>setCat(e.target.value)}>
          {cats.map(([k,{label}])=><option key={k} value={k}>{label}</option>)}
        </Select>
        <Input label="Descrição" placeholder="Descreva a movimentação" value={descricao} onChange={e=>setDesc(e.target.value)} error={errs.descricao}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Input label="Data" type="date" value={data} onChange={e=>setData(e.target.value)}/>
          <Input label="Responsável" value={responsavel} onChange={e=>setResp(e.target.value)}/>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal Lançamento de débito/crédito ─────────────────────────────────────
function ModalLancamento({ open, onClose, aluno, tipoInicial, onSalvo }) {
  // ✅ TODOS os hooks primeiro
  const [tipo,      setTipo]   = useState(tipoInicial||"debito");
  const [valor,     setValor]  = useState("");
  const [descricao, setDesc]   = useState("");
  const [saving,    setSaving] = useState(false);
  const [errs,      setErrs]   = useState({});

  useEffect(() => {
    setTipo(tipoInicial||"debito");
    setValor(""); setDesc(""); setErrs({});
  }, [open, tipoInicial]);

  // Guard depois dos hooks
  if (!aluno) return null;

  const salvar = async () => {
    const e = {};
    if (!valor || Number(valor)<=0) e.valor="Valor inválido";
    if (!descricao.trim()) e.desc="Descrição obrigatória";
    setErrs(e); if (Object.keys(e).length) return;
    setSaving(true);
    try {
      if (tipo==="debito") { await db.adicionarDebito(aluno.id,Number(valor),descricao.trim()); toast.success(`💳 Débito de ${fmt(valor)} lançado!`); }
      else { await db.reduzirSaldo(aluno.id,Number(valor),descricao.trim()); toast.success(`✅ Crédito de ${fmt(valor)} aplicado!`); }
      onSalvo?.(); onClose();
    } catch(err) { toast.error(err.message); }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} width={440}
      title={tipo==="debito"?"Lançar Débito":"Lançar Crédito"} subtitle={aluno.nome}
      footer={<div style={{display:"flex",gap:10}}><Btn variant="ghost" full onClick={onClose}>Cancelar</Btn><Btn variant={tipo==="debito"?"err":"ok"} full loading={saving} onClick={salvar}>{tipo==="debito"?"Lançar Débito":"Aplicar Crédito"}</Btn></div>}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[["debito","Débito","err"],["credito","Crédito","ok"]].map(([t,l,v])=>(
            <button key={t} type="button" onClick={()=>setTipo(t)}
              style={{padding:"10px 0",borderRadius:12,fontWeight:700,fontFamily:"inherit",fontSize:13,cursor:"pointer",border:`1.5px solid ${tipo===t?(v==="ok"?C.ok:C.err):C.border}`,background:tipo===t?(v==="ok"?C.okDim:C.errDim):C.surfB,color:tipo===t?(v==="ok"?C.ok:C.err):C.sub,transition:"all .18s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              {t==="debito"?<ArrowUp size={14}/>:<ArrowDown size={14}/>}{l}
            </button>
          ))}
        </div>
        <div style={{background:C.surfB,border:`1px solid ${C.border}`,borderRadius:13,padding:"12px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{color:C.muted,fontSize:13}}>Saldo atual</span>
            <span style={{color:aluno.saldo_devedor>0?C.err:C.ok,fontWeight:900,fontSize:16}}>{fmt(aluno.saldo_devedor)}</span>
          </div>
          {Number(valor)>0 && (
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
              <span style={{color:C.muted,fontSize:12}}>Novo saldo (est.)</span>
              <span style={{color:tipo==="debito"?C.err:C.ok,fontWeight:700,fontSize:13}}>
                {tipo==="debito"?fmt((aluno.saldo_devedor||0)+Number(valor)):fmt(Math.max(0,(aluno.saldo_devedor||0)-Number(valor)))}
              </span>
            </div>
          )}
        </div>
        <Input label="Valor (R$)" type="number" min="0.01" step="0.01" placeholder="0,00" value={valor} onChange={e=>setValor(e.target.value)} error={errs.valor} icon={DollarSign}/>
        <Input label="Descrição" placeholder={tipo==="debito"?"Ex: Cobrança de maio, material":"Ex: Pagamento recebido"} value={descricao} onChange={e=>setDesc(e.target.value)} error={errs.desc}/>
      </div>
    </Modal>
  );
}

// ─── Modal Histórico do aluno ────────────────────────────────────────────────
function ModalHistorico({ aluno, movFinanceiras, comprovantes, onClose, onLancar }) {
  // ✅ Hook antes do guard
  const [aba, setAba] = useState("movimentos");

  if (!aluno) return null;

  const hist  = (movFinanceiras||[]).filter(m=>Number(m.aluno_id)===Number(aluno.id)).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const comps = (comprovantes||[]).filter(c=>Number(c.aluno_id)===Number(aluno.id)).sort((a,b)=>new Date(b.enviado_em||b.created_at)-new Date(a.enviado_em||a.created_at));
  const totDeb = hist.filter(m=>m.tipo==="debito").reduce((s,m)=>s+m.valor,0);
  const totCre = hist.filter(m=>m.tipo==="credito").reduce((s,m)=>s+m.valor,0);

  return (
    <Modal open={!!aluno} onClose={onClose} title="Histórico" subtitle={aluno.nome} width={540}>
      <div style={{background:C.surfB,border:`1px solid ${C.border}`,borderRadius:14,padding:16,marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:13,marginBottom:14}}>
          <Avatar nome={aluno.nome} size={44}/>
          <div style={{flex:1}}>
            <div style={{color:C.txt,fontWeight:800,fontSize:15}}>{aluno.nome}</div>
            <div style={{color:C.sub,fontSize:12,marginTop:3}}>Turma {TURMA}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{color:C.muted,fontSize:11}}>Saldo devedor</div>
            <div style={{color:aluno.saldo_devedor>0?C.err:C.ok,fontWeight:900,fontSize:20}}>{fmt(aluno.saldo_devedor)}</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{background:C.errDim,border:`1px solid ${C.errBdr}`,borderRadius:10,padding:"9px 12px"}}>
            <div style={{color:C.muted,fontSize:11}}>Total debitado</div>
            <div style={{color:C.err,fontWeight:800,fontSize:15}}>{fmt(totDeb)}</div>
          </div>
          <div style={{background:C.okDim,border:`1px solid ${C.okBdr}`,borderRadius:10,padding:"9px 12px"}}>
            <div style={{color:C.muted,fontSize:11}}>Total creditado</div>
            <div style={{color:C.ok,fontWeight:800,fontSize:15}}>{fmt(totCre)}</div>
          </div>
        </div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <Btn variant="err" size="sm" icon={ArrowUp} full onClick={()=>onLancar(aluno,"debito")}>Lançar Débito</Btn>
        <Btn variant="ok" size="sm" icon={ArrowDown} full onClick={()=>onLancar(aluno,"credito")}>Lançar Crédito</Btn>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {[["movimentos","Movimentos"],["comprovantes","Comprovantes"]].map(([k,l])=>(
          <button key={k} type="button" onClick={()=>setAba(k)}
            style={{padding:"7px 14px",borderRadius:10,border:`1px solid ${aba===k?C.acc:C.border}`,background:aba===k?C.accDim:C.surfB,color:aba===k?C.acc:C.sub,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all .16s"}}>
            {l}
          </button>
        ))}
      </div>

      {aba==="movimentos" && (
        hist.length===0 ? <Empty icon={DollarSign} title="Sem movimentos" desc="Nenhum débito ou crédito registrado."/> : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {hist.map(m=>(
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:12,background:C.surfB,borderRadius:12,border:`1px solid ${C.border}`,padding:"12px 14px"}}>
                <div style={{width:36,height:36,borderRadius:10,background:(m.tipo==="debito"?C.err:C.ok)+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {m.tipo==="debito"?<ArrowUp size={16} color={C.err}/>:<ArrowDown size={16} color={C.ok}/>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:C.txt,fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.descricao}</div>
                  <div style={{color:C.muted,fontSize:11,marginTop:2}}>{fmtDateTime(m.created_at)} · {m.criado_por}</div>
                </div>
                <div style={{color:m.tipo==="debito"?C.err:C.ok,fontWeight:900,fontSize:14,whiteSpace:"nowrap"}}>
                  {m.tipo==="debito"?"+":"-"}{fmt(m.valor)}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {aba==="comprovantes" && (
        comps.length===0 ? <Empty icon={CheckCircle} title="Sem comprovantes"/> : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {comps.map(c=>{
              const color=c.status==="aprovado"?C.ok:c.status==="rejeitado"?C.err:C.warn;
              return (
                <div key={c.id} style={{background:C.surfB,borderRadius:12,border:`1px solid ${C.border}`,padding:"12px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <span style={{background:color+"18",color,border:`1px solid ${color}44`,padding:"2px 10px",borderRadius:99,fontSize:10,fontWeight:800}}>
                      {c.status==="aprovado"?"APROVADO":c.status==="rejeitado"?"REJEITADO":"AGUARDANDO"}
                    </span>
                    <span style={{color:C.gold,fontWeight:900,fontSize:15}}>{fmt(c.valor)}</span>
                  </div>
                  <div style={{color:C.txt,fontSize:13,marginBottom:3}}>{c.descricao||"Comprovante"}</div>
                  <div style={{color:C.muted,fontSize:11}}>Enviado: {fmtDateTime(c.enviado_em)}</div>
                  {c.motivo_recusa&&<div style={{color:C.err,fontSize:11,marginTop:4}}>Motivo: {c.motivo_recusa}</div>}
                  {c.comprovante_url&&<a href={c.comprovante_url} target="_blank" rel="noreferrer" style={{color:C.acc,fontSize:12,fontWeight:700,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4,marginTop:6}}><Eye size={12}/> Ver</a>}
                </div>
              );
            })}
          </div>
        )
      )}
    </Modal>
  );
}

// ─── Tab Dashboard ───────────────────────────────────────────────────────────
function TabDashboard({ data, onNewEntry, onNewExit, onTabChange }) {
  const { movs, alunos, comprovantes, movFinanceiras } = data;

  const totalEnt    = movs.filter(m=>m.tipo==="entrada").reduce((s,m)=>s+Number(m.valor),0);
  const totalSai    = movs.filter(m=>m.tipo==="saida").reduce((s,m)=>s+Number(m.valor),0);
  const saldo       = totalEnt - totalSai;
  const dividaTotal = alunos.reduce((s,a)=>s+(Number(a.saldo_devedor)||0),0);
  const inadimpl    = alunos.filter(a=>Number(a.saldo_devedor)>0).length;
  const quites      = alunos.filter(a=>Number(a.saldo_devedor)<=0).length;
  const aguardando  = comprovantes.filter(c=>c.status==="aguardando").length;

  const now = new Date();
  const chartData = useMemo(()=>{
    const res=[];
    for(let i=5;i>=0;i--){
      const d=new Date(now.getFullYear(),now.getMonth()-i,1);
      const ym=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const items=movFinanceiras.filter(m=>(m.created_at||"").startsWith(ym));
      res.push({mes:MESES_SHORT[d.getMonth()],debitos:items.filter(m=>m.tipo==="debito").reduce((s,m)=>s+m.valor,0),creditos:items.filter(m=>m.tipo==="credito").reduce((s,m)=>s+m.valor,0)});
    }
    return res;
  },[movFinanceiras]);

  const recentMovs = movs.slice(0,6);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14,animation:"fadeUp .28s ease"}}>
      {aguardando>0 && (
        <motion.button type="button" initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
          onClick={()=>onTabChange("aprovacoes")}
          style={{background:`linear-gradient(120deg,${C.acc}1e,${C.purple}1e)`,border:`1px solid ${C.accBdr}`,borderRadius:16,padding:"13px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",width:"100%",textAlign:"left",fontFamily:"inherit"}}>
          <div style={{position:"relative",flexShrink:0}}>
            <div style={{width:38,height:38,borderRadius:12,background:C.accDim,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Bell size={17} color={C.acc}/>
            </div>
            <span style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:99,background:C.err,border:`2px solid ${C.bg}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:"#fff"}}>{aguardando>9?"9+":aguardando}</span>
          </div>
          <div style={{flex:1}}>
            <div style={{color:C.txt,fontWeight:800,fontSize:14,marginBottom:2}}>{aguardando} comprovante{aguardando>1?"s":""} aguardando</div>
            <div style={{color:C.sub,fontSize:12}}>Toque para revisar e aprovar</div>
          </div>
          <ChevronRight size={17} color={C.acc}/>
        </motion.button>
      )}

      {/* Hero saldo */}
      <div style={{background:"linear-gradient(135deg,#1a1060,#0e1a3a 50%,#0a1628)",borderRadius:22,padding:"22px 20px 20px",position:"relative",overflow:"hidden",border:`1px solid ${C.accBdr}`,boxShadow:`0 8px 40px rgba(99,102,241,.22)`}}>
        <div style={{position:"absolute",top:-44,right:-44,width:160,height:160,borderRadius:"50%",background:`radial-gradient(circle,${C.acc}28,transparent 70%)`,pointerEvents:"none"}}/>
        <div style={{color:"rgba(255,255,255,.55)",fontSize:11,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",marginBottom:7}}>SALDO DO CAIXA</div>
        <div style={{color:"#fff",fontSize:34,fontWeight:900,letterSpacing:"-.035em",lineHeight:1,marginBottom:18}}>{fmt(saldo)}</div>
        <div style={{height:1,background:"rgba(255,255,255,.1)",marginBottom:16}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:0}}>
          {[["Entradas",fmt(totalEnt),C.ok],["Saídas",fmt(totalSai),C.err],["Dívida turma",fmt(dividaTotal),C.warn]].map(([l,v,c],i)=>(
            <div key={l} style={{paddingLeft:i>0?12:0,borderLeft:i>0?"1px solid rgba(255,255,255,.1)":"none"}}>
              <div style={{color:"rgba(255,255,255,.45)",fontSize:10,fontWeight:600,marginBottom:4,letterSpacing:".04em"}}>{l.toUpperCase()}</div>
              <div style={{color:c,fontWeight:800,fontSize:13}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {[
          {icon:UserX,    label:"Inadimplentes", value:String(inadimpl),      color:C.err,  gradient:C.errGrad,  sub:`de ${alunos.length} alunos`},
          {icon:UserCheck,label:"Sem dívida",     value:String(quites),        color:C.ok,   gradient:C.okGrad,   sub:`de ${alunos.length} alunos`},
          {icon:DollarSign,label:"Dívida total",  value:fmt(dividaTotal),      color:C.warn, gradient:C.warnGrad},
          {icon:Clock,    label:"Aguardando",     value:String(aguardando),    color:C.acc,  gradient:C.accGrad},
        ].map((k,i)=><KPICard key={i} {...k} small/>)}
      </div>

      {/* Gráfico */}
      <Card style={{padding:"18px 16px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{color:C.txt,fontSize:14,fontWeight:700}}>Movimentos — 6 Meses</div>
          <div style={{display:"flex",gap:12,fontSize:11}}>
            {[["Débitos",C.err],["Créditos",C.ok]].map(([l,c])=>(
              <span key={l} style={{color:c,display:"flex",alignItems:"center",gap:4}}>
                <span style={{width:8,height:8,borderRadius:2,background:c,display:"inline-block"}}/>{l}
              </span>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={148}>
          <BarChart data={chartData} barCategoryGap="34%" margin={{top:0,right:4,left:-18,bottom:0}}>
            <CartesianGrid strokeDasharray="2 4" stroke={C.border} vertical={false}/>
            <XAxis dataKey="mes" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false} width={44} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
            <Tooltip cursor={{fill:"rgba(99,102,241,.07)"}} contentStyle={{background:C.surfC,border:`1px solid ${C.border}`,borderRadius:12,fontSize:12,color:C.txt}} formatter={v=>[fmt(v)]}/>
            <Bar dataKey="debitos" name="Débitos" fill={C.err} radius={[6,6,0,0]}/>
            <Bar dataKey="creditos" name="Créditos" fill={C.ok} radius={[6,6,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Ações rápidas */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <QuickAction icon={TrendingUp}   label="Nova Entrada"  color={C.ok}     onClick={onNewEntry}/>
        <QuickAction icon={TrendingDown} label="Nova Saída"    color={C.err}    onClick={onNewExit}/>
        <QuickAction icon={Users}        label="Ver Alunos"    color={C.acc}    onClick={()=>onTabChange("alunos")}/>
        <QuickAction icon={CheckCircle}  label="Aprovações"    color={C.purple} onClick={()=>onTabChange("aprovacoes")}/>
      </div>

      {/* Últimas movs */}
      {recentMovs.length>0&&(
        <Card>
          <div style={{padding:"15px 18px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{color:C.txt,fontSize:14,fontWeight:700}}>Últimas Movimentações</div>
            <button type="button" onClick={()=>onTabChange("caixa")} style={{background:"none",border:"none",color:C.acc,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>Ver todas<ChevronRight size={13}/></button>
          </div>
          <Divider/>
          {recentMovs.map((m,i)=>{
            const ci=catInfo(m.tipo,m.categoria);
            return (
              <div key={m.id}>
                <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px"}}>
                  <div style={{width:38,height:38,borderRadius:12,background:(m.tipo==="entrada"?C.ok:C.err)+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {m.tipo==="entrada"?<TrendingUp size={16} color={C.ok}/>:<TrendingDown size={16} color={C.err}/>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:C.txt,fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.descricao}</div>
                    <div style={{display:"flex",gap:6,marginTop:3,alignItems:"center"}}>
                      <span style={{color:C.muted,fontSize:11}}>{fmtDateShort(m.data)}</span>
                      <span style={{background:ci.color+"18",color:ci.color,fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:99}}>{ci.label}</span>
                    </div>
                  </div>
                  <span style={{color:m.tipo==="entrada"?C.ok:C.err,fontWeight:900,fontSize:14,whiteSpace:"nowrap"}}>{m.tipo==="entrada"?"+":"-"}{fmt(m.valor)}</span>
                </div>
                {i<recentMovs.length-1&&<Divider/>}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

// ─── Tab Alunos ──────────────────────────────────────────────────────────────
function TabAlunos({ data }) {
  const { alunos, movFinanceiras, comprovantes, reload } = data;
  const [busca,    setBusca]  = useState("");
  const [filtro,   setFiltro] = useState("todos");
  const [mHist,    setMHist]  = useState(null);
  const [mLanc,    setMLanc]  = useState(null);
  const [mNovo,    setMNovo]  = useState(false);
  const [novoNome, setNome]   = useState("");
  const [saving,   setSaving] = useState(false);
  const [delId,    setDelId]  = useState(null);
  const [deleting, setDel]    = useState(false);

  const alunosFilt = useMemo(()=>{
    let l=alunos;
    if(busca) l=l.filter(a=>a.nome.toLowerCase().includes(busca.toLowerCase()));
    if(filtro==="devendo") l=l.filter(a=>Number(a.saldo_devedor)>0);
    if(filtro==="quites")  l=l.filter(a=>Number(a.saldo_devedor)<=0);
    return l;
  },[alunos,busca,filtro]);

  const devendo=alunos.filter(a=>Number(a.saldo_devedor)>0).length;
  const quites =alunos.filter(a=>Number(a.saldo_devedor)<=0).length;

  const handleAdd=async()=>{ if(!novoNome.trim()){toast.error("Digite o nome");return;} setSaving(true); try{await db.insertAluno(novoNome);toast.success("👤 Aluno adicionado!");setNome("");setMNovo(false);await reload();}catch(e){toast.error(e.message);} setSaving(false); };
  const handleDel=async()=>{ setDel(true); try{await db.deleteAluno(delId);toast.success("Aluno removido.");setDelId(null);await reload();}catch(e){toast.error(e.message);} setDel(false); };

  return (
    <div>
      <SectionHeader title={`Alunos — Turma ${TURMA}`} sub={`${alunos.length} de ${TOTAL_ALUNOS} cadastrados`}
        style={{marginBottom:14}} right={<Btn size="sm" icon={Plus} onClick={()=>setMNovo(true)}>Adicionar</Btn>}/>
      {alunos.length<TOTAL_ALUNOS&&<Alert type="warn" style={{marginBottom:12}}>{TOTAL_ALUNOS-alunos.length} aluno(s) faltando. Execute o SQL.</Alert>}

      <div style={{display:"flex",gap:8,marginBottom:12,overflowX:"auto",paddingBottom:2}}>
        {[["todos",`Todos (${alunos.length})`],["devendo",`⚠ Devendo (${devendo})`],["quites",`✓ Quites (${quites})`]].map(([f,l])=>(
          <button key={f} type="button" onClick={()=>setFiltro(f)}
            style={{padding:"7px 14px",borderRadius:99,whiteSpace:"nowrap",border:`1px solid ${filtro===f?C.acc:C.border}`,background:filtro===f?C.accDim:C.surfB,color:filtro===f?C.acc:C.sub,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit",transition:"all .18s"}}>
            {l}
          </button>
        ))}
      </div>

      <div style={{position:"relative",marginBottom:14}}>
        <Search size={14} style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:C.muted}}/>
        <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder={`Buscar entre ${alunos.length} alunos…`}
          style={{width:"100%",background:C.surfB,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"11px 14px 11px 36px",color:C.txt,fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {alunosFilt.map((aluno,i)=>{
          const dev=Number(aluno.saldo_devedor)>0;
          const {bg,border:bd,text}=avatarColor(aluno.nome);
          return (
            <motion.div key={aluno.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*.007}}>
              <Card style={{border:`1px solid ${dev?C.errBdr:C.border}`,background:dev?"rgba(239,68,68,.025)":C.surf}}>
                <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:bg,border:`1.5px solid ${bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:text,flexShrink:0}}>
                    {avatarLetters(aluno.nome)}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:C.txt,fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{aluno.nome}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
                      <span style={{color:dev?C.err:C.ok,fontWeight:900,fontSize:14}}>{fmt(aluno.saldo_devedor)}</span>
                      <span style={{background:dev?C.errDim:C.okDim,color:dev?C.err:C.ok,border:`1px solid ${dev?C.errBdr:C.okBdr}`,padding:"1px 8px",borderRadius:99,fontSize:9,fontWeight:800}}>{dev?"DEVENDO":"QUITE"}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    <button type="button" onClick={()=>setMHist(aluno)} style={{background:C.accDim,border:"none",borderRadius:9,padding:"7px 9px",cursor:"pointer",color:C.acc,display:"flex"}}><Eye size={14}/></button>
                    <button type="button" onClick={()=>setMLanc({aluno,tipo:"debito"})} style={{background:C.errDim,border:"none",borderRadius:9,padding:"7px 9px",cursor:"pointer",color:C.err,display:"flex"}}><ArrowUp size={14}/></button>
                    <button type="button" onClick={()=>setMLanc({aluno,tipo:"credito"})} style={{background:C.okDim,border:"none",borderRadius:9,padding:"7px 9px",cursor:"pointer",color:C.ok,display:"flex"}}><ArrowDown size={14}/></button>
                    <button type="button" onClick={()=>setDelId(aluno.id)} style={{background:C.errDim,border:"none",borderRadius:9,padding:"7px 9px",cursor:"pointer",color:C.err,display:"flex"}}><Trash2 size={14}/></button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
        {alunosFilt.length===0&&<Empty icon={Users} title="Nenhum aluno" desc="Ajuste o filtro ou adicione alunos."/>}
      </div>

      <ModalHistorico aluno={mHist} movFinanceiras={movFinanceiras} comprovantes={comprovantes} onClose={()=>setMHist(null)} onLancar={(a,t)=>{setMHist(null);setMLanc({aluno:a,tipo:t});}}/>
      <ModalLancamento open={!!mLanc} onClose={()=>setMLanc(null)} aluno={mLanc?.aluno} tipoInicial={mLanc?.tipo} onSalvo={()=>{reload();setMLanc(null);}}/>
      <Modal open={mNovo} onClose={()=>{setMNovo(false);setNome("");}} title="Adicionar Aluno" width={380}
        footer={<div style={{display:"flex",gap:10}}><Btn variant="ghost" full onClick={()=>{setMNovo(false);setNome("");}}>Cancelar</Btn><Btn full loading={saving} onClick={handleAdd}>Adicionar</Btn></div>}>
        <Input label="Nome completo" placeholder="Ex: Dante Santos Melo" value={novoNome} onChange={e=>setNome(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdd()}/>
      </Modal>
      <ConfirmDialog open={!!delId} onClose={()=>setDelId(null)} onConfirm={handleDel} loading={deleting} title="Excluir Aluno" message="Remove o aluno e TODO o histórico financeiro. Ação irreversível."/>
    </div>
  );
}

// ─── Tab Caixa ───────────────────────────────────────────────────────────────
function TabCaixa({ data, onNew }) {
  const { movs, reload } = data;
  const [busca,    setBusca]  = useState("");
  const [filtro,   setFiltro] = useState("todos");
  const [editando, setEdit]   = useState(null);
  const [delId,    setDelId]  = useState(null);
  const [deleting, setDel]    = useState(false);

  const filtered=useMemo(()=>{
    let l=movs;
    if(busca) l=l.filter(m=>m.descricao?.toLowerCase().includes(busca.toLowerCase())||m.categoria?.toLowerCase().includes(busca.toLowerCase()));
    if(filtro!=="todos") l=l.filter(m=>m.tipo===filtro);
    return l;
  },[movs,busca,filtro]);

  const totEnt=filtered.filter(m=>m.tipo==="entrada").reduce((s,m)=>s+Number(m.valor),0);
  const totSai=filtered.filter(m=>m.tipo==="saida").reduce((s,m)=>s+Number(m.valor),0);

  const handleDel=async()=>{ setDel(true); try{await db.deleteMovimentacao(delId);toast.success("Excluído.");await reload();setDelId(null);}catch(e){toast.error(e.message);} setDel(false); };

  const exportCSV=()=>{
    const rows=filtered.map(m=>`${m.data},${m.tipo},${m.categoria},"${m.descricao}",${m.valor},"${m.responsavel}"`).join("\n");
    const blob=new Blob(["\uFEFF"+"Data,Tipo,Categoria,Descrição,Valor,Responsável\n"+rows],{type:"text/csv;charset=utf-8;"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`caixa-${today()}.csv`;a.click();URL.revokeObjectURL(a.href);
    toast.success("CSV exportado!");
  };

  return (
    <div>
      <SectionHeader title="Caixa da Turma" sub={`${filtered.length} registros`} style={{marginBottom:14}}
        right={<div style={{display:"flex",gap:8}}><Btn variant="ghost" size="sm" onClick={exportCSV}>CSV</Btn><Btn variant="ok" size="sm" icon={TrendingUp} onClick={()=>onNew("entrada")}>+ Entrada</Btn><Btn variant="err" size="sm" icon={TrendingDown} onClick={()=>onNew("saida")}>+ Saída</Btn></div>}/>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
        {[["Entradas",fmt(totEnt),C.ok],["Saídas",fmt(totSai),C.err],["Saldo",fmt(totEnt-totSai),(totEnt-totSai)>=0?C.acc:C.err]].map(x=>(
          <div key={x[0]} style={{background:C.surfB,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 13px",textAlign:"center"}}>
            <div style={{color:x[2],fontWeight:900,fontSize:14}}>{x[1]}</div>
            <div style={{color:C.muted,fontSize:11,marginTop:3}}>{x[0]}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {["todos","entrada","saida"].map(f=>(
          <button key={f} type="button" onClick={()=>setFiltro(f)}
            style={{padding:"7px 15px",borderRadius:99,border:`1px solid ${filtro===f?C.acc:C.border}`,background:filtro===f?C.accDim:C.surfB,color:filtro===f?C.acc:C.sub,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit",transition:"all .18s"}}>
            {f==="todos"?"Todos":f==="entrada"?"Entradas":"Saídas"}
          </button>
        ))}
      </div>

      <div style={{position:"relative",marginBottom:14}}>
        <Search size={13} style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:C.muted}}/>
        <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar movimentações…"
          style={{width:"100%",background:C.surfB,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"11px 14px 11px 36px",color:C.txt,fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
      </div>

      {filtered.length===0?<Empty icon={Wallet} title="Sem movimentações" desc="Registre entradas e saídas acima."/>:(
        <Card>
          {filtered.map((m,i)=>{
            const ci=catInfo(m.tipo,m.categoria);
            return (
              <div key={m.id}>
                <div style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px"}}>
                  <div style={{width:38,height:38,borderRadius:12,background:(m.tipo==="entrada"?C.ok:C.err)+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {m.tipo==="entrada"?<TrendingUp size={16} color={C.ok}/>:<TrendingDown size={16} color={C.err}/>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:C.txt,fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.descricao}</div>
                    <div style={{display:"flex",gap:8,marginTop:3,alignItems:"center"}}>
                      <span style={{color:C.muted,fontSize:11}}>{fmtDateShort(m.data)}</span>
                      <span style={{background:ci.color+"18",color:ci.color,fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:99}}>{ci.label}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{color:m.tipo==="entrada"?C.ok:C.err,fontWeight:900,fontSize:14,whiteSpace:"nowrap"}}>{m.tipo==="entrada"?"+":"-"}{fmt(m.valor)}</span>
                    <button type="button" onClick={()=>setEdit(m)} style={{background:C.accDim,border:"none",borderRadius:8,padding:"5px 7px",cursor:"pointer",color:C.acc,display:"flex"}}><Edit3 size={13}/></button>
                    <button type="button" onClick={()=>setDelId(m.id)} style={{background:C.errDim,border:"none",borderRadius:8,padding:"5px 7px",cursor:"pointer",color:C.err,display:"flex"}}><Trash2 size={13}/></button>
                  </div>
                </div>
                {i<filtered.length-1&&<Divider/>}
              </div>
            );
          })}
        </Card>
      )}
      <ModalMovimentacao open={!!editando} onClose={()=>setEdit(null)} editando={editando} onSalvo={reload}/>
      <ConfirmDialog open={!!delId} onClose={()=>setDelId(null)} onConfirm={handleDel} loading={deleting} title="Excluir" message="Esta ação não pode ser desfeita."/>
    </div>
  );
}

// ─── Tab Aprovações ──────────────────────────────────────────────────────────
function TabAprovacoes({ data }) {
  const { comprovantes, alunos, reload } = data;
  const [savingId, setSavId]  = useState(null);
  const [rejModal, setRejMod] = useState(null);
  const [motivo,   setMotivo] = useState("");
  const [saving,   setSaving] = useState(false);

  const pendentes = comprovantes.filter(c=>c.status==="aguardando");
  const historico = comprovantes.filter(c=>c.status!=="aguardando").slice(0,30);
  const getAluno  = id=>alunos.find(a=>Number(a.id)===Number(id));

  const handleAprovar=async(comp)=>{ setSavId(comp.id); try{ await db.aprovarComprovante(comp.id); const a=getAluno(comp.aluno_id); toast.success(`✅ Aprovado! Saldo de ${a?.nome?.split(" ")[0]||"aluno"} reduzido.`); await reload(); }catch(e){toast.error(e.message);} setSavId(null); };
  const handleRejeitar=async()=>{ if(!motivo.trim()){toast.error("Informe o motivo");return;} setSaving(true); try{ await db.rejeitarComprovante(rejModal.id,motivo); toast.success("Comprovante rejeitado."); setRejMod(null);setMotivo(""); await reload(); }catch(e){toast.error(e.message);} setSaving(false); };

  return (
    <div>
      <SectionHeader title="Aprovações" sub={`${pendentes.length} aguardando`} style={{marginBottom:14}}
        right={pendentes.length>0&&<span style={{background:C.errDim,color:C.err,border:`1px solid ${C.errBdr}`,padding:"4px 12px",borderRadius:99,fontSize:13,fontWeight:800}}>{pendentes.length}</span>}/>

      {pendentes.length===0?(
        <Card style={{marginBottom:20}}><Empty icon={CheckCircle} title="Tudo aprovado!" desc="Nenhum comprovante aguardando revisão."/></Card>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
          {pendentes.map((comp,i)=>{
            const aluno=getAluno(comp.aluno_id);
            return (
              <motion.div key={comp.id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*.04}}>
                <Card style={{border:`1px solid ${C.warnBdr}`}}>
                  <div style={{padding:18}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
                      <Avatar nome={aluno?.nome||"?"} size={42}/>
                      <div style={{flex:1}}>
                        <div style={{color:C.txt,fontWeight:700,fontSize:15}}>{aluno?.nome||"Aluno não encontrado"}</div>
                        <div style={{color:C.muted,fontSize:12,marginTop:2}}>Enviado {fmtDateTime(comp.enviado_em)}</div>
                        {comp.observacao_aluno&&<div style={{color:C.sub,fontSize:12,marginTop:4,fontStyle:"italic"}}>"{comp.observacao_aluno}"</div>}
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{color:C.gold,fontWeight:900,fontSize:20}}>{fmt(comp.valor)}</div>
                        <div style={{color:C.muted,fontSize:11}}>a creditar</div>
                      </div>
                    </div>
                    {comp.comprovante_url?(
                      <div style={{borderRadius:12,overflow:"hidden",border:`1px solid ${C.border}`,marginBottom:14}}>
                        <img src={comp.comprovante_url} alt="comprovante" style={{width:"100%",maxHeight:240,objectFit:"contain",background:C.surfB,display:"block"}}/>
                        <a href={comp.comprovante_url} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"9px",color:C.acc,fontSize:12,fontWeight:700,textDecoration:"none",background:C.surfB,borderTop:`1px solid ${C.border}`}}><Eye size={13}/> Abrir completo</a>
                      </div>
                    ):(
                      <div style={{border:`2px dashed ${C.border}`,borderRadius:12,padding:"20px",textAlign:"center",marginBottom:14}}>
                        <Info size={24} color={C.muted} style={{marginBottom:6}}/>
                        <div style={{color:C.muted,fontSize:13}}>Sem imagem anexada</div>
                      </div>
                    )}
                    <div style={{display:"flex",gap:10}}>
                      <Btn variant="ghost" full onClick={()=>{setRejMod(comp);setMotivo("");}}>Rejeitar</Btn>
                      <Btn variant="ok" full loading={savingId===comp.id} onClick={()=>handleAprovar(comp)}><CheckCircle size={14}/> Aprovar e Creditar</Btn>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {historico.length>0&&(
        <>
          <div style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Histórico</div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {historico.map(comp=>{
              const aluno=getAluno(comp.aluno_id);
              const color=comp.status==="aprovado"?C.ok:C.err;
              return (
                <Card key={comp.id} style={{padding:"12px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                    <Avatar nome={aluno?.nome||"?"} size={34}/>
                    <div style={{flex:1}}>
                      <div style={{color:C.txt,fontSize:13,fontWeight:700}}>{aluno?.nome}</div>
                      <div style={{color:C.muted,fontSize:11}}>{fmtDate(comp.enviado_em?.split("T")[0])}</div>
                    </div>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}>
                      <span style={{fontWeight:800,fontSize:13,color:C.gold}}>{fmt(comp.valor)}</span>
                      <span style={{background:color+"18",color,border:`1px solid ${color}44`,padding:"2px 9px",borderRadius:99,fontSize:9,fontWeight:800}}>{comp.status==="aprovado"?"APROVADO":"REJEITADO"}</span>
                    </div>
                  </div>
                  {comp.motivo_recusa&&<div style={{color:C.err,fontSize:11,marginTop:6,paddingLeft:46}}>Motivo: {comp.motivo_recusa}</div>}
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Modal open={!!rejModal} onClose={()=>setRejMod(null)} title="Rejeitar Comprovante" width={400}
        footer={<div style={{display:"flex",gap:10}}><Btn variant="ghost" full onClick={()=>setRejMod(null)}>Cancelar</Btn><Btn variant="err" full loading={saving} onClick={handleRejeitar}>Confirmar Rejeição</Btn></div>}>
        <Textarea label="Motivo da rejeição (obrigatório)" placeholder="Ex: Comprovante ilegível…" value={motivo} onChange={e=>setMotivo(e.target.value)} style={{minHeight:90}}/>
      </Modal>
    </div>
  );
}

// ─── Secretaria Layout Principal ─────────────────────────────────────────────
export default function Secretaria({ user, onLogout, data }) {
  const { movs, comprovantes, loading, dbError, reload } = data;
  const [tab,  setTab]  = useState("dashboard");
  const [mMov, setMMov] = useState(null);

  const pendAprov = comprovantes.filter(c=>c.status==="aguardando").length;
  const totalEnt  = movs.filter(m=>m.tipo==="entrada").reduce((s,m)=>s+Number(m.valor),0);
  const totalSai  = movs.filter(m=>m.tipo==="saida").reduce((s,m)=>s+Number(m.valor),0);
  const saldo     = totalEnt - totalSai;
  const navBadge  = {dashboard:0,alunos:0,caixa:0,aprovacoes:pendAprov};

  return (
    <div style={{display:"flex",flexDirection:"column",minHeight:"100dvh",background:C.bg,fontFamily:"'Inter',system-ui,sans-serif",overflowX:"hidden"}}>
      {/* Top bar */}
      <header style={{position:"sticky",top:0,zIndex:200,flexShrink:0,background:C.surf+"e8",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:`1px solid ${C.border}`}}>
        <div style={{padding:"0 16px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <div style={{background:C.accGrad,borderRadius:11,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 18px ${C.acc}44`,flexShrink:0}}>
              <GraduationCap size={17} color="#fff"/>
            </div>
            <div>
              <div style={{fontWeight:900,fontSize:14,letterSpacing:"-.025em",color:C.txt,lineHeight:1.2}}>CaixaSala</div>
              <div style={{fontSize:10,color:C.muted}}>Turma {TURMA}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{background:C.surfB,border:`1px solid ${saldo>=0?C.okBdr:C.errBdr}`,borderRadius:99,padding:"5px 11px",display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:6,height:6,borderRadius:99,background:saldo>=0?C.ok:C.err}}/>
              <span style={{color:saldo>=0?C.ok:C.err,fontSize:12,fontWeight:800,letterSpacing:"-.01em"}}>{fmt(saldo)}</span>
            </div>
            {loading&&<Spinner size={16} color={C.acc}/>}
            {pendAprov>0&&(
              <motion.button type="button" animate={{scale:[1,1.06,1]}} transition={{repeat:Infinity,duration:2.4}}
                onClick={()=>setTab("aprovacoes")}
                style={{background:C.accDim,border:`1px solid ${C.accBdr}`,borderRadius:99,padding:"5px 10px",display:"flex",alignItems:"center",gap:5,cursor:"pointer",fontFamily:"inherit"}}>
                <Bell size={12} color={C.acc}/>
                <span style={{color:C.acc,fontSize:12,fontWeight:800}}>{pendAprov}</span>
              </motion.button>
            )}
            <motion.button type="button" whileTap={{rotate:180,scale:.88}} transition={{duration:.25}} onClick={reload}
              style={{background:C.surfB,border:`1px solid ${C.border}`,borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.muted}}>
              <RefreshCw size={14}/>
            </motion.button>
            <motion.button type="button" whileTap={{scale:.9}} onClick={onLogout}
              style={{background:C.errDim,border:`1px solid ${C.errBdr}`,borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.err}}>
              <LogOut size={14}/>
            </motion.button>
          </div>
        </div>
        <div style={{padding:"0 16px 9px",display:"flex",alignItems:"center",gap:8}}>
          <span style={{color:C.muted,fontSize:12}}>{NAV.find(n=>n.id===tab)?.label}</span>
          {user?.email&&<><span style={{color:C.muted,fontSize:12}}>·</span><span style={{color:C.muted,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:180}}>{user.email}</span></>}
        </div>
      </header>

      {dbError&&(
        <motion.div initial={{height:0}} animate={{height:"auto"}} style={{background:C.errDim,borderBottom:`1px solid ${C.errBdr}`,padding:"10px 16px",display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
          <AlertTriangle size={14} color={C.err}/><span style={{color:C.err,fontSize:13}}>{dbError}</span>
        </motion.div>
      )}

      {/* Content */}
      <main style={{flex:1,padding:"14px",overflowY:"auto",overflowX:"hidden",paddingBottom:"calc(66px + env(safe-area-inset-bottom,0px) + 14px)"}}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.17}}>
            {tab==="dashboard"  &&<TabDashboard  data={data} onNewEntry={()=>setMMov("entrada")} onNewExit={()=>setMMov("saida")} onTabChange={setTab}/>}
            {tab==="alunos"     &&<TabAlunos     data={data}/>}
            {tab==="caixa"      &&<TabCaixa      data={data} onNew={t=>setMMov(t)}/>}
            {tab==="aprovacoes" &&<TabAprovacoes data={data}/>}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom nav */}
      <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:300,background:C.surf+"f2",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderTop:`1px solid ${C.border}`,boxShadow:"0 -8px 32px rgba(0,0,0,.45)",paddingBottom:"env(safe-area-inset-bottom,4px)"}}>
        <div style={{display:"flex",height:57}}>
          {NAV.map(item=>{
            const active=tab===item.id, badge=navBadge[item.id]||0;
            return (
              <button key={item.id} type="button" onClick={()=>setTab(item.id)}
                style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,background:"none",border:"none",cursor:"pointer",color:active?C.acc:C.muted,position:"relative",fontFamily:"inherit",padding:"7px 0",transition:"color .16s"}}>
                {active&&<motion.div layoutId="bot-nav-bg" style={{position:"absolute",top:5,left:"12%",right:"12%",bottom:5,background:C.accDim,borderRadius:11}} transition={{type:"spring",stiffness:380,damping:34}}/>}
                <motion.div animate={{scale:active?1.1:1,y:active?-1:0}} transition={{type:"spring",stiffness:300,damping:22}} style={{position:"relative",zIndex:1}}>
                  <item.icon size={20} strokeWidth={active?2.5:1.8}/>
                  {badge>0&&<motion.span initial={{scale:0}} animate={{scale:1}} style={{position:"absolute",top:-4,right:-6,background:C.err,color:"#fff",borderRadius:99,fontSize:8,fontWeight:900,padding:"1px 4px",minWidth:15,textAlign:"center",border:`1.5px solid ${C.surf}`,lineHeight:"1.4"}}>{badge>9?"9+":badge}</motion.span>}
                </motion.div>
                <span style={{fontSize:9,fontWeight:active?800:500,letterSpacing:".015em",position:"relative",zIndex:1}}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <ModalMovimentacao open={!!mMov} onClose={()=>setMMov(null)} editando={null} onSalvo={reload} key={mMov||"closed"}/>
    </div>
  );
}
