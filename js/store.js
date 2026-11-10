import { supabase } from "./supabase.js";

export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.name = "ApiError"; this.status = status; }
}
export function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
export function severityClass(value) { return ({ "Crítico":"critical","Alto":"high","Médio":"medium","Baixo":"low" })[value] || "low"; }
export function statusClass(value) { return value === "Resolvido" ? "resolved" : "status"; }
export function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"});
}
const severityToDb = { "Baixo":"BAIXO","Médio":"MEDIO","Alto":"ALTO","Crítico":"CRITICO" };
const severityFromDb = { BAIXO:"Baixo",MEDIO:"Médio",ALTO:"Alto",CRITICO:"Crítico" };
const statusToDb = { "Aberto":"ABERTO","Em análise":"EM_ANALISE","Contido":"CONTIDO","Resolvido":"RESOLVIDO" };
const statusFromDb = { ABERTO:"Aberto",EM_ANALISE:"Em análise",CONTIDO:"Contido",RESOLVIDO:"Resolvido" };
const roleLabel = { ADMIN:"Administrador", ANALISTA:"Analista", LEITURA:"Somente leitura" };

function mapIncident(row) {
  return { id:row.id, code:row.codigo, title:row.titulo, description:row.descricao,
    type:row.tipos_ameaca?.nome || "—", severity:severityFromDb[row.gravidade] || row.gravidade,
    status:statusFromDb[row.status] || row.status, createdAt:row.criado_em,
    createdBy:row.profiles?.nome || "Usuário", threatId:row.tipo_ameaca_id };
}
export async function initShell() {
  const { data:{ user }, error:authError } = await supabase.auth.getUser();
  if (authError || !user) { location.replace("login.html"); return null; }
  const { data:profile, error } = await supabase.from("profiles").select("id,nome,perfil,ativo").eq("id",user.id).single();
  if (error || !profile || !profile.ativo) { await supabase.auth.signOut(); location.replace("login.html"); return null; }
  const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  set("profileName",profile.nome); set("profileRole",roleLabel[profile.perfil] || "Usuário");
  set("profileAvatar",(profile.nome || "CG").trim().slice(0,2).toUpperCase());
  document.getElementById("menuBtn")?.addEventListener("click",()=>document.getElementById("sidebar")?.classList.toggle("open"));
  document.getElementById("logoutBtn")?.addEventListener("click",async()=>{ await supabase.auth.signOut(); location.replace("login.html"); });
  return { id:user.id, name:profile.nome, role:profile.perfil };
}
export async function getIncidents(filters={}) {
  let q=supabase.from("incidentes").select("*,tipos_ameaca(nome),profiles!incidentes_criado_por_fkey(nome)").is("arquivado_em",null).order("criado_em",{ascending:false});
  if(filters.severity) q=q.eq("gravidade",severityToDb[filters.severity] || filters.severity);
  if(filters.status) q=q.eq("status",statusToDb[filters.status] || filters.status);
  const {data,error}=await q; if(error) throw new ApiError(error.message);
  let rows=(data||[]).map(row=>mapIncident({...row,profiles:row.profiles}));
  if(filters.q) { const term=filters.q.toLowerCase(); rows=rows.filter(r=>[r.code,r.title,r.description,r.type].some(v=>String(v||"").toLowerCase().includes(term))); }
  return rows;
}
export async function createIncident(data) {
  const {data:profile,error:pErr}=await supabase.from("profiles").select("id").single();
  if(pErr) throw new ApiError(pErr.message);
  const {data:threats,error:tErr}=await supabase.from("tipos_ameaca").select("id,nome");
  if(tErr) throw new ApiError(tErr.message);
  const threat=threats.find(t=>t.nome===data.type) || threats.find(t=>t.nome==="Outro");
  if(!threat) throw new ApiError("Tipo de ameaça não encontrado.");
  const {data:row,error}=await supabase.from("incidentes").insert({codigo:data.code || `CG-${Date.now()}`,titulo:data.title,descricao:data.description,tipo_ameaca_id:threat.id,gravidade:severityToDb[data.severity] || "MEDIO",status:"ABERTO",criado_por:profile.id}).select("*,tipos_ameaca(nome)").single();
  if(error) throw new ApiError(error.message);
  await logEvent("INCIDENTE_CRIADO","incidentes",row.id,{codigo:row.codigo});
  return mapIncident(row);
}
export async function updateIncidentStatus(id,status) {
  const payload={status:statusToDb[status] || status, atualizado_em:new Date().toISOString()};
  if(status==="Resolvido") payload.resolvido_em=new Date().toISOString();
  const {error}=await supabase.from("incidentes").update(payload).eq("id",id); if(error) throw new ApiError(error.message);
  await logEvent("STATUS_ALTERADO","incidentes",id,{status});
  return {success:true};
}
export async function archiveIncident(id) {
  const {error}=await supabase.from("incidentes").update({arquivado_em:new Date().toISOString()}).eq("id",id);
  if(error) throw new ApiError(error.message);
  await logEvent("INCIDENTE_ARQUIVADO","incidentes",id,{});
  return {success:true};
}
export async function getThreats() {
  const {data:threats,error}=await supabase.from("tipos_ameaca").select("id,nome,descricao").order("nome");
  if(error) throw new ApiError(error.message);
  const {data:incidents}=await supabase.from("incidentes").select("tipo_ameaca_id").is("arquivado_em",null);
  return (threats||[]).map(t=>({id:t.id,name:t.nome,description:t.descricao,count:(incidents||[]).filter(i=>i.tipo_ameaca_id===t.id).length}));
}
async function logEvent(event,entity,entityId,details) {
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return;
  await supabase.from("auditoria").insert({usuario_id:user.id,evento:event,entidade:entity,entidade_id:String(entityId),detalhes:details});
}
export async function getAudit(limit=100) {
  const {data,error}=await supabase.from("auditoria").select("*,profiles(nome)").order("criado_em",{ascending:false}).limit(Math.max(1,Math.min(Number(limit)||100,200)));
  if(error) throw new ApiError(error.message);
  return (data||[]).map(r=>({createdAt:r.criado_em,user:r.profiles?.nome||"Conta removida",event:r.evento,entity:r.entidade,entityId:r.entidade_id,details:r.detalhes,ip:"—"}));
}
