import { getIncidents, escapeHTML, initShell } from "./store.js";

const user = await initShell();
if (!user) throw new Error("Sessão não autenticada.");

let incidents = [];
const countSeverity = (severity) => incidents.filter((item) => item.severity === severity).length;
const setText = (id, value) => {
  document.getElementById(id).textContent = String(value);
};

function csvSafe(value) {
  const text = String(value ?? "");
  const firstMeaningfulCharacter = text.replace(/^\s+/, "").charAt(0);
  const protectedText = ["=", "+", "-", "@", "\t", "\r"].includes(firstMeaningfulCharacter)
    ? `'${text}`
    : text;
  return `"${protectedText.replace(/"/g, '""')}"`;
}

function exportCsv() {
  const headings = ["Código", "Título", "Tipo", "Gravidade", "Status", "Descrição", "Criado em", "Criado por"];
  const rows = incidents.map((item) => [
    item.id,
    item.title,
    item.type,
    item.severity,
    item.status,
    item.description,
    item.createdAt,
    item.createdBy
  ]);
  const content = [headings, ...rows]
    .map((row) => row.map(csvSafe).join(";"))
    .join("\r\n");
  const blob = new Blob(["\ufeff", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "cyberguard-relatorio.csv";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

try {
  incidents = await getIncidents();
  const total = incidents.length;
  const critical = countSeverity("Crítico");
  const active = incidents.filter((item) => ["Aberto", "Em análise", "Contido"].includes(item.status)).length;
  const resolved = incidents.filter((item) => item.status === "Resolvido").length;

  setText("reportTotal", total);
  setText("reportCritical", critical);
  setText("reportActive", active);
  setText("reportResolved", resolved);

  const host = document.getElementById("reportSeverity");
  const empty = document.getElementById("reportEmpty");
  empty.hidden = total > 0;
  if (total) {
    host.innerHTML = ["Crítico", "Alto", "Médio", "Baixo"].map((severity) => {
      const count = countSeverity(severity);
      const width = (count / total) * 100;
      return `<div class="threat-row"><span>${escapeHTML(severity)}</span><div class="progress"><span style="width:${width}%"></span></div><b>${count}</b></div>`;
    }).join("");
  }
  document.getElementById("exportCsv").disabled = total === 0;
  document.getElementById("exportCsv").addEventListener("click", exportCsv);
} catch (error) {
  document.getElementById("reportError").textContent = error.message || "Não foi possível gerar o relatório.";
  document.getElementById("exportCsv").disabled = true;
}
