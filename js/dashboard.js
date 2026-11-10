import {
  getIncidents,
  getThreats,
  escapeHTML,
  severityClass,
  statusClass,
  formatDate,
  initShell
} from "./store.js";

const user = await initShell();
if (!user) throw new Error("Sessão não autenticada.");

const bySeverity = (items, severity) => items.filter((item) => item.severity === severity).length;
const setText = (id, value) => {
  const element = document.getElementById(id);
  if (element) element.textContent = String(value);
};

setText("today", new Date().toLocaleDateString("pt-BR", { dateStyle: "full" }));

try {
  const [incidents, threats] = await Promise.all([getIncidents(), getThreats()]);
  const total = incidents.length;
  const resolved = incidents.filter((item) => item.status === "Resolvido").length;
  const active = incidents.filter((item) => ["Aberto", "Em análise", "Contido"].includes(item.status)).length;

  setText("totalCount", total);
  setText("threatCount", threats.filter((item) => item.count > 0).length);
  setText("resolvedCount", resolved);
  setText("resolvedRate", `${total ? Math.round((resolved / total) * 100) : 0}% do total`);
  setText("analysisCount", active);

  const chart = document.getElementById("severityChart");
  if (total) {
    const labels = ["Crítico", "Alto", "Médio", "Baixo"];
    chart.innerHTML = labels.map((severity) => {
      const count = bySeverity(incidents, severity);
      const height = Math.max(4, (count / total) * 100);
      return `<div class="bar-group"><div class="bar" style="height:${height}%" role="img" aria-label="${severity}: ${count}"></div><span class="bar-label">${severity} · ${count}</span></div>`;
    }).join("");
  } else {
    chart.innerHTML = '<div class="empty-state">Ainda não há incidentes para gerar o gráfico.</div>';
  }

  const threatBreakdown = document.getElementById("threatBreakdown");
  const usedThreats = threats.filter((item) => item.count > 0);
  if (usedThreats.length) {
    const maxCount = Math.max(...usedThreats.map((item) => item.count));
    threatBreakdown.innerHTML = usedThreats.map((item) => {
      const width = maxCount ? (item.count / maxCount) * 100 : 0;
      return `<div class="threat-row"><span>${escapeHTML(item.name)}</span><div class="progress"><span style="width:${width}%"></span></div><b>${item.count}</b></div>`;
    }).join("");
  } else {
    threatBreakdown.innerHTML = '<div class="empty-state">Nenhuma ameaça registrada.</div>';
  }

  const latest = [...incidents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
  const tableBody = document.getElementById("recentTable");
  const empty = document.getElementById("recentEmpty");
  empty.hidden = latest.length > 0;
  tableBody.innerHTML = latest.map((item) => `
    <tr>
      <td>${escapeHTML(item.id)}</td>
      <td>${escapeHTML(item.type)}</td>
      <td>${escapeHTML(item.title)}</td>
      <td><span class="badge ${severityClass(item.severity)}">${escapeHTML(item.severity)}</span></td>
      <td><span class="badge ${statusClass(item.status)}">${escapeHTML(item.status)}</span></td>
      <td>${escapeHTML(formatDate(item.createdAt))}</td>
    </tr>`).join("");
} catch (error) {
  document.getElementById("dashboardError").textContent = error.message || "Não foi possível carregar o dashboard.";
}
