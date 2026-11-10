import { getThreats, escapeHTML, initShell } from "./store.js";

const user = await initShell();
if (!user) throw new Error("Sessão não autenticada.");

const catalog = document.getElementById("threatCatalog");
const errorBox = document.getElementById("threatError");

try {
  const threats = await getThreats();
  if (!threats.length) {
    catalog.innerHTML = '<div class="empty-state">Nenhuma categoria cadastrada no banco de dados.</div>';
  } else {
    catalog.innerHTML = threats.map((threat) => `
      <div class="threat-row" style="grid-template-columns:minmax(140px, 190px) 1fr 45px">
        <b>${escapeHTML(threat.name)}</b>
        <span class="muted">${escapeHTML(threat.description)}</span>
        <b>${Number(threat.count) || 0}</b>
      </div>`).join("");
  }
} catch (error) {
  catalog.innerHTML = '<div class="empty-state">Não foi possível carregar o catálogo.</div>';
  errorBox.textContent = error.message || "Falha ao consultar o servidor.";
}
