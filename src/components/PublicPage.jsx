/**
 * PublicPage.jsx — Área Pública do Aluno
 * Aluno seleciona nome → vê saldo devedor → envia comprovante de pagamento
 * Hooks: todos antes de qualquer return condicional ✅
 */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  GraduationCap, Lock, Search, ChevronRight,
  CheckCircle, Clock, XCircle, AlertTriangle,
  Send, TrendingUp, TrendingDown, Wallet, UserCheck,
  RefreshCw, Info, Loader2, Eye, ArrowUp, ArrowDown,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { db } from "../lib/supabase.js";
import {
  C, TURMA, fmt, fmtDate, fmtDateTime, fmtDateShort,
  today, avatarLetters, avatarColor, MESES_SHORT,
} from "../lib/utils.js";
import { Btn, Modal, FileUpload, Card, ProgressBar, Alert, Divider, Spinner, Avatar } from "../lib/ui.jsx";

// ─── Modal: aluno envia comprovante ─────────────────────────────────────────
function ModalEnviarComprovante({ open, onClose, aluno, config, onEnviado }) {
  // ✅ TODOS os hooks primeiro
  const [valor,    setValor]   = useState("");
  const [descricao,setDesc]    = useState("");
  const [obs,      setObs]     = useState("");
  const [file,     setFile]    = useState(null);
  const [enviando, setEnv]     = useState(false);
  const [step,     setStep]    = useState("form");

  // Reset quando modal fecha — useEffect correto (não useState!)
  useEffect(() => {
    if (!open) {
      setValor(""); setDesc(""); setObs(""); setFile(null); setStep("form");
    }
  }, [open]);

  // Guard depois dos hooks
  if (!aluno) return null;

  const handleEnviar = async () => {
    if (!valor || Number(valor) <= 0) { toast.error("Informe o valor pago"); return; }
    setEnv(true);
    try {
      let comprovanteUrl = null, storagePath = null;
      if (file) {
        const r = await db.uploadComprovante(file, aluno.id);
        comprovanteUrl = r.url;
        storagePath    = r.path;
      }
      await db.enviarComprovante({
        alunoId:       aluno.id,
        valor:         Number(valor),
        descricao:     descricao.trim() || "Pagamento",
        comprovanteUrl,
        storagePath,
        observacao:    obs.trim(),
      });
      setStep("sucesso");
      toast.success("✅ Comprovante enviado! Aguarde aprovação.");
      await onEnviado?.();
    } catch(e) {
      toast.error(e.message || "Erro ao enviar");
    }
    setEnv(false);
  };

  const handleClose = () => { setStep("form"); setValor(""); setDesc(""); setObs(""); setFile(null); onClose(); };

  return (
    <Modal open={open} onClose={handleClose} width={480}
      title={step==="sucesso"?"Comprovante Enviado! 🎉":"Enviar Comprovante de Pagamento"}
      subtitle={step==="form"?aluno?.nome:undefined}
      footer={step==="form"?(
        <div style={{display:"flex",gap:10}}>
          <Btn variant="ghost" full onClick={handleClose}>Cancelar</Btn>
          <Btn variant="ok" full loading={enviando} onClick={handleEnviar} icon={Send}>{enviando?"Enviando…":"Enviar Comprovante"}</Btn>
        </div>
      ):<Btn full onClick={handleClose}>Fechar</Btn>}>
      {step==="form"?(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* Saldo */}
          <div style={{background:C.surfB,border:`1px solid ${C.border}`,borderRadius:14,padding:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{color:C.muted,fontSize:13}}>Saldo devedor atual</span>
              <span style={{color:aluno.saldo_devedor>0?C.err:C.ok,fontWeight:900,fontSize:18}}>{fmt(aluno.saldo_devedor)}</span>
            </div>
            <div style={{color:C.sub,fontSize:12}}>Informe o valor que está pagando. A secretária irá confirmar.</div>
          </div>

          <Alert type="info">Envie o comprovante do PIX ou do pagamento realizado. O saldo será reduzido após aprovação.</Alert>

          {/* Valor */}
          <div>
            <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,marginBottom:6}}>Valor pago (R$) *</label>
            <input type="number" min="0.01" step="0.01" placeholder="0,00" value={valor} onChange={e=>setValor(e.target.value)}
              style={{width:"100%",background:C.surfB,border:`1.5px solid ${C.border}`,borderRadius:13,padding:"12px 14px",color:C.txt,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          </div>

          <div>
            <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,marginBottom:6}}>Referência (opcional)</label>
            <input placeholder="Ex: Pagamento de maio, evento, etc" value={descricao} onChange={e=>setDesc(e.target.value)}
              style={{width:"100%",background:C.surfB,border:`1.5px solid ${C.border}`,borderRadius:13,padding:"12px 14px",color:C.txt,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          </div>

          <FileUpload onFile={setFile} label="Foto do comprovante (opcional)" hint="JPG, PNG ou PDF · máx 5MB"/>

          <div>
            <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,marginBottom:6}}>Observação (opcional)</label>
            <textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Ex: Paguei via PIX às 14h…"
              style={{width:"100%",background:C.surfB,border:`1.5px solid ${C.border}`,borderRadius:13,padding:"12px 14px",color:C.txt,fontSize:13,fontFamily:"inherit",outline:"none",resize:"vertical",minHeight:70,boxSizing:"border-box"}}/>
          </div>
        </div>
      ):(
        <div style={{textAlign:"center",padding:"20px 10px 10px"}}>
          <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:200}}>
            <div style={{width:72,height:72,borderRadius:22,background:C.okDim,border:`2px solid ${C.okBdr}`,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>
              <CheckCircle size={36} color={C.ok}/>
            </div>
          </motion.div>
          <div style={{color:C.txt,fontWeight:800,fontSize:18,marginBottom:8}}>Comprovante enviado!</div>
          <div style={{color:C.sub,fontSize:14,lineHeight:1.6}}>A secretária irá analisar e creditar o valor no seu saldo. Você será notificado em breve.</div>
        </div>
      )}
    </Modal>
  );
}

// ─── Modal detalhe do aluno ──────────────────────────────────────────────────
function ModalAluno({ aluno, movFinanceiras, comprovantes, config, onClose, onReload }) {
  // ✅ TODOS os hooks primeiro — antes de qualquer guard
  const [enviandoModal, setEnvModal] = useState(false);

  // Guard depois dos hooks
  if (!aluno) return null;

  const hist  = (movFinanceiras||[]).filter(m=>Number(m.aluno_id)===Number(aluno.id)).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const comps = (comprovantes||[]).filter(c=>Number(c.aluno_id)===Number(aluno.id)).sort((a,b)=>new Date(b.enviado_em||b.created_at)-new Date(a.enviado_em||a.created_at));
  const totalPago = hist.filter(m=>m.tipo==="credito").reduce((s,m)=>s+m.valor,0);
  const devendo   = Number(aluno.saldo_devedor) > 0;

  return (
    <Modal open={!!aluno} onClose={onClose} title={aluno.nome.split(" ").slice(0,2).join(" ")} width={520}>
      {/* Header */}
      <div style={{background:C.surfB,border:`1px solid ${C.border}`,borderRadius:14,padding:16,marginBottom:18}}>
        <div style={{display:"flex",alignItems:"center",gap:13,marginBottom:14}}>
          <Avatar nome={aluno.nome} size={48}/>
          <div style={{flex:1}}>
            <div style={{color:C.txt,fontWeight:800,fontSize:16}}>{aluno.nome}</div>
            <div style={{color:C.sub,fontSize:12,marginTop:3}}>Turma {TURMA}</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{background:devendo?C.errDim:C.okDim,border:`1px solid ${devendo?C.errBdr:C.okBdr}`,borderRadius:10,padding:"10px 14px"}}>
            <div style={{color:C.muted,fontSize:11}}>Saldo devedor</div>
            <div style={{color:devendo?C.err:C.ok,fontWeight:900,fontSize:18}}>{fmt(aluno.saldo_devedor)}</div>
          </div>
          <div style={{background:C.okDim,border:`1px solid ${C.okBdr}`,borderRadius:10,padding:"10px 14px"}}>
            <div style={{color:C.muted,fontSize:11}}>Total pago</div>
            <div style={{color:C.ok,fontWeight:900,fontSize:18}}>{fmt(totalPago)}</div>
          </div>
        </div>
      </div>

      {/* CTA pagar */}
      {devendo?(
        <Btn full variant="ok" size="lg" icon={Send} onClick={()=>setEnvModal(true)} style={{marginBottom:20}}>
          Enviar Comprovante de Pagamento
        </Btn>
      ):(
        <div style={{background:C.okDim,border:`1px solid ${C.okBdr}`,borderRadius:14,padding:"14px 16px",marginBottom:20,textAlign:"center"}}>
          <CheckCircle size={28} color={C.ok} style={{marginBottom:8}}/>
          <div style={{color:C.ok,fontWeight:800,fontSize:15}}>Você está quite! ✨</div>
        </div>
      )}

      {/* Comprovantes enviados */}
      {comps.length>0&&(
        <>
          <div style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Comprovantes Enviados</div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
            {comps.slice(0,5).map(c=>{
              const color=c.status==="aprovado"?C.ok:c.status==="rejeitado"?C.err:C.warn;
              return (
                <div key={c.id} style={{background:C.surfB,borderRadius:12,border:`1px solid ${C.border}`,padding:"11px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <span style={{background:color+"18",color,border:`1px solid ${color}44`,padding:"2px 9px",borderRadius:99,fontSize:9,fontWeight:800}}>
                      {c.status==="aprovado"?"APROVADO":c.status==="rejeitado"?"REJEITADO":"AGUARDANDO"}
                    </span>
                    <span style={{color:C.gold,fontWeight:900,fontSize:14}}>{fmt(c.valor)}</span>
                  </div>
                  <div style={{color:C.sub,fontSize:12}}>{c.descricao||"Pagamento"} · {fmtDateTime(c.enviado_em)}</div>
                  {c.motivo_recusa&&<div style={{color:C.err,fontSize:11,marginTop:4}}>Recusado: {c.motivo_recusa}</div>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Histórico movimentos */}
      {hist.length>0&&(
        <>
          <div style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Histórico</div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {hist.slice(0,8).map(m=>(
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:12,background:C.surfB,borderRadius:11,border:`1px solid ${C.border}`,padding:"10px 13px"}}>
                <div style={{width:32,height:32,borderRadius:9,background:(m.tipo==="debito"?C.err:C.ok)+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {m.tipo==="debito"?<ArrowUp size={14} color={C.err}/>:<ArrowDown size={14} color={C.ok}/>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:C.txt,fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.descricao}</div>
                  <div style={{color:C.muted,fontSize:11,marginTop:1}}>{fmtDateTime(m.created_at)}</div>
                </div>
                <span style={{color:m.tipo==="debito"?C.err:C.ok,fontWeight:800,fontSize:13,whiteSpace:"nowrap"}}>
                  {m.tipo==="debito"?"+":"-"}{fmt(m.valor)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal enviar comprovante */}
      <ModalEnviarComprovante
        open={enviandoModal}
        onClose={()=>setEnvModal(false)}
        aluno={aluno}
        config={config}
        onEnviado={async()=>{ await onReload?.(); setEnvModal(false); }}
      />
    </Modal>
  );
}

// ─── Public Page ─────────────────────────────────────────────────────────────
export default function PublicPage({ data }) {
  const { movs, alunos, movFinanceiras, comprovantes, loading, reload } = data;
  const navigate   = useNavigate();
  const [busca,    setBusca]  = useState("");
  const [selAluno, setSel]    = useState(null);

  const totalEnt   = movs.filter(m=>m.tipo==="entrada").reduce((s,m)=>s+Number(m.valor),0);
  const totalSai   = movs.filter(m=>m.tipo==="saida").reduce((s,m)=>s+Number(m.valor),0);
  const saldo      = totalEnt - totalSai;
  const dividaTotal= alunos.reduce((s,a)=>s+(Number(a.saldo_devedor)||0),0);
  const inadimpl   = alunos.filter(a=>Number(a.saldo_devedor)>0).length;
  const aguardando = comprovantes.filter(c=>c.status==="aguardando").length;

  // Gráfico 6 meses
  const now = new Date();
  const chartData = useMemo(()=>{
    const res=[];
    for(let i=5;i>=0;i--){
      const d=new Date(now.getFullYear(),now.getMonth()-i,1);
      const ym=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const items=movFinanceiras.filter(m=>(m.created_at||"").startsWith(ym));
      res.push({mes:MESES_SHORT[d.getMonth()],creditos:items.filter(m=>m.tipo==="credito").reduce((s,m)=>s+m.valor,0)});
    }
    return res;
  },[movFinanceiras]);

  const alunosFilt = useMemo(()=>{
    if(!busca) return alunos;
    return alunos.filter(a=>a.nome.toLowerCase().includes(busca.toLowerCase()));
  },[alunos,busca]);

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.txt,fontFamily:"'Inter',system-ui,sans-serif",paddingBottom:32}}>
      {/* BG glow */}
      <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:600,height:300,background:`radial-gradient(ellipse,${C.acc}0e 0%,transparent 70%)`,pointerEvents:"none",zIndex:0}}/>

      {/* Header */}
      <header style={{background:C.surf+"dd",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:720,margin:"0 auto",padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{background:C.accGrad,borderRadius:10,padding:"7px 8px",boxShadow:`0 0 16px ${C.acc}44`}}>
              <GraduationCap size={18} color="#fff"/>
            </div>
            <div>
              <div style={{fontWeight:900,fontSize:14,letterSpacing:"-.025em"}}>CaixaSala</div>
              <div style={{fontSize:10,color:C.muted}}>Turma {TURMA}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {loading&&<Spinner size={16} color={C.acc}/>}
            <button onClick={reload} type="button" style={{background:C.surfB,border:`1px solid ${C.border}`,borderRadius:10,padding:"7px 8px",cursor:"pointer",color:C.muted,display:"flex"}}>
              <RefreshCw size={14}/>
            </button>
            <Btn variant="ghost" size="sm" icon={Lock} onClick={()=>navigate("/login")}>Secretária</Btn>
          </div>
        </div>
      </header>

      <div style={{maxWidth:720,margin:"0 auto",padding:"24px 16px",position:"relative",zIndex:1}}>

        {/* Hero */}
        <div style={{textAlign:"center",marginBottom:28}}>
          <h1 style={{fontSize:"clamp(24px,6vw,38px)",fontWeight:900,margin:"0 0 8px",letterSpacing:"-.03em",background:`linear-gradient(135deg,${C.txt},${C.acc})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            Caixa da Turma {TURMA}
          </h1>
          <p style={{color:C.muted,fontSize:14,margin:"0 auto",maxWidth:400,lineHeight:1.5}}>
            Selecione seu nome para ver seu saldo e enviar comprovante.
          </p>
        </div>

        {/* Saldo hero */}
        <div style={{background:"linear-gradient(135deg,#1a1060,#0e1a3a 50%,#0a1628)",borderRadius:22,padding:"20px 20px 18px",marginBottom:20,position:"relative",overflow:"hidden",border:`1px solid ${C.accBdr}`,boxShadow:`0 8px 32px ${C.acc}22`}}>
          <div style={{position:"absolute",top:-40,right:-40,width:140,height:140,borderRadius:"50%",background:`radial-gradient(circle,${C.acc}28,transparent 70%)`,pointerEvents:"none"}}/>
          <div style={{color:"rgba(255,255,255,.55)",fontSize:11,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>SALDO DO CAIXA</div>
          <div style={{color:"#fff",fontSize:30,fontWeight:900,letterSpacing:"-.035em",marginBottom:16}}>{fmt(saldo)}</div>
          <div style={{height:1,background:"rgba(255,255,255,.1)",marginBottom:14}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:0}}>
            {[["Entradas",fmt(totalEnt),C.ok],["Saídas",fmt(totalSai),C.err],["Dívida turma",fmt(dividaTotal),C.warn]].map(([l,v,c],i)=>(
              <div key={l} style={{paddingLeft:i>0?12:0,borderLeft:i>0?"1px solid rgba(255,255,255,.1)":"none"}}>
                <div style={{color:"rgba(255,255,255,.45)",fontSize:9,fontWeight:600,marginBottom:3,letterSpacing:".04em"}}>{l.toUpperCase()}</div>
                <div style={{color:c,fontWeight:800,fontSize:12}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats compactos */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
          <div style={{background:C.surf,border:`1px solid ${C.errBdr}`,borderRadius:14,padding:"13px 16px"}}>
            <div style={{color:C.muted,fontSize:11}}>Inadimplentes</div>
            <div style={{color:C.err,fontWeight:900,fontSize:22,marginTop:3}}>{inadimpl}</div>
            <div style={{color:C.muted,fontSize:11,marginTop:2}}>de {alunos.length} alunos</div>
          </div>
          <div style={{background:C.surf,border:`1px solid ${aguardando>0?C.accBdr:C.border}`,borderRadius:14,padding:"13px 16px"}}>
            <div style={{color:C.muted,fontSize:11}}>Aguardando aprovação</div>
            <div style={{color:aguardando>0?C.acc:C.muted,fontWeight:900,fontSize:22,marginTop:3}}>{aguardando}</div>
            <div style={{color:C.muted,fontSize:11,marginTop:2}}>comprovantes</div>
          </div>
        </div>

        {/* Gráfico pagamentos */}
        {chartData.some(d=>d.creditos>0)&&(
          <Card style={{padding:"18px 16px",marginBottom:20}}>
            <div style={{color:C.txt,fontSize:14,fontWeight:700,marginBottom:14}}>Pagamentos Recebidos — 6 Meses</div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} barCategoryGap="38%" margin={{top:0,right:4,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="2 4" stroke={C.border} vertical={false}/>
                <XAxis dataKey="mes" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false} width={42} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
                <Tooltip contentStyle={{background:C.surfC,border:`1px solid ${C.border}`,borderRadius:12,fontSize:12,color:C.txt}} formatter={v=>[fmt(v),"Recebido"]}/>
                <Bar dataKey="creditos" name="Recebido" fill={C.ok} radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Lista alunos */}
        <Card>
          <div style={{padding:"16px 18px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{color:C.txt,fontSize:14,fontWeight:700}}>Alunos da Turma {TURMA}</div>
              <div style={{color:C.muted,fontSize:12,marginTop:2}}>Toque para ver saldo e pagar</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <span style={{background:C.errDim,color:C.err,border:`1px solid ${C.errBdr}`,padding:"3px 11px",borderRadius:99,fontSize:11,fontWeight:800}}>⚠ {inadimpl}</span>
              <span style={{background:C.okDim,color:C.ok,border:`1px solid ${C.okBdr}`,padding:"3px 11px",borderRadius:99,fontSize:11,fontWeight:800}}>✓ {alunos.length-inadimpl}</span>
            </div>
          </div>

          <div style={{padding:"0 18px 12px",position:"relative"}}>
            <Search size={13} style={{position:"absolute",left:30,top:"50%",transform:"translateY(-50%)",color:C.muted}}/>
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder={`Buscar dentre ${alunos.length} alunos…`}
              style={{width:"100%",background:C.surfB,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 14px 10px 34px",color:C.txt,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>

          <Divider/>

          <div>
            {alunosFilt.map((a,i)=>{
              const dev=Number(a.saldo_devedor)>0;
              const comp=comprovantes.find(c=>Number(c.aluno_id)===Number(a.id)&&c.status==="aguardando");
              const {bg,border:bd,text}=avatarColor(a.nome);
              return (
                <div key={a.id}>
                  <motion.button type="button" whileTap={{scale:.98}} onClick={()=>setSel(a)}
                    style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"13px 18px",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
                    <div style={{width:40,height:40,borderRadius:12,background:bg,border:`1.5px solid ${bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:text,flexShrink:0}}>
                      {avatarLetters(a.nome)}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{color:C.txt,fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.nome}</div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
                        <span style={{color:dev?C.err:C.ok,fontWeight:800,fontSize:13}}>{fmt(a.saldo_devedor)}</span>
                        <span style={{background:dev?C.errDim:C.okDim,color:dev?C.err:C.ok,border:`1px solid ${dev?C.errBdr:C.okBdr}`,padding:"1px 8px",borderRadius:99,fontSize:9,fontWeight:800}}>{dev?"DEVENDO":"QUITE"}</span>
                        {comp&&<span style={{background:C.warnDim,color:C.warn,border:`1px solid ${C.warnBdr}`,padding:"1px 7px",borderRadius:99,fontSize:9,fontWeight:800}}>AGUARDANDO</span>}
                      </div>
                    </div>
                    <ChevronRight size={15} color={C.muted}/>
                  </motion.button>
                  {i<alunosFilt.length-1&&<Divider/>}
                </div>
              );
            })}
            {alunosFilt.length===0&&<div style={{textAlign:"center",padding:"32px 20px",color:C.muted,fontSize:14}}>Nenhum aluno encontrado</div>}
          </div>
        </Card>
      </div>

      {/* Modal detalhe aluno */}
      <ModalAluno
        aluno={selAluno}
        movFinanceiras={movFinanceiras}
        comprovantes={comprovantes}
        config={{}}
        onClose={()=>setSel(null)}
        onReload={reload}
      />
    </div>
  );
}
