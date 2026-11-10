import {
  getIncidents,
  createIncident,
  updateIncidentStatus,
  archiveIncident,
  escapeHTML,
  severityClass,
  statusClass,
  formatDate,
  initShell
} from "./store.js";

const user = await initShell();
if (!user) throw new Error("Sessão não autenticada.");

const form = document.getElementById("incidentForm");
const formPanel = document.getElementById("incidentFormPanel");
const readOnlyNotice = document.getElementById("readOnlyNotice");
const tableBody = document.getElementById("incidentTable");
const emptyState = document.getElementById("incidentEmpty");
const errorBox = document.getElementById("incidentError");
const successBox = document.getElementById("incidentSuccess");
const listError = document.getElementById("listError");
const createButton = document.getElementById("createIncidentBtn");
const canWrite = ["ADMIN", "ANALISTA"].includes(user.role);
const canArchive = user.role === "ADMIN";
const nextStatus = {
  "Aberto": "Em análise",
  "Em análise": "Contido",
  "Contido": "Resolvido",
  "Resolvido": "Aberto"
};

if (!canWrite) {
  formPanel.hidden = true;
  readOnlyNotice.hidden = false;
}

function renderRows(items) {
  emptyState.hidden = items.length > 0;
  if (!items.length) {
    tableBody.replaceChildren();
    return;
  }

  tableBody.innerHTML = items.map((item) => {
    const statusButton = canWrite
      ? `<button class="button secondary small" type="button" data-status-id="${escapeHTML(item.id)}" data-next-status="${escapeHTML(nextStatus[item.status] || "Em análise")}">${item.status === "Resolvido" ? "Reabrir" : "Avançar status"}</button>`
      : "";
    const archiveButton = canArchive
      ? `<button class="button secondary small" type="button" data-archive-id="${escapeHTML(item.id)}">Arquivar</button>`
      : "";

    return `<tr>
      <td>${escapeHTML(item.id)}</td>
      <td><b>${escapeHTML(item.title)}</b><br><span class="muted">${escapeHTML(item.type)}</span></td>
      <td><span class="badge ${severityClass(item.severity)}">${escapeHTML(item.severity)}</span></td>
      <td><span class="badge ${statusClass(item.status)}">${escapeHTML(item.status)}</span></td>
      <td>${escapeHTML(formatDate(item.createdAt))}</td>
      <td>${statusButton} ${archiveButton}</td>
    </tr>`;
  }).join("");
}

let latestRequest = 0;
async function render() {
  const requestId = ++latestRequest;
  listError.textContent = "";
  const filters = {
    q: document.getElementById("searchIncident").value.trim(),
    severity: document.getElementById("filterSeverity").value,
    status: document.getElementById("filterStatus").value
  };
  try {
    const incidents = await getIncidents(filters);
    if (requestId !== latestRequest) return;
    renderRows(incidents);
  } catch (error) {
    if (requestId !== latestRequest) return;
    tableBody.replaceChildren();
    emptyState.hidden = false;
    emptyState.textContent = "Não foi possível carregar os incidentes.";
    listError.textContent = error.message || "Falha ao consultar o servidor.";
  }
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.textContent = "";
  successBox.textContent = "";
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const payload = {
    title: String(data.get("title") || "").trim(),
    type: String(data.get("type") || "").trim(),
    severity: String(data.get("severity") || "").trim(),
    description: String(data.get("description") || "").trim()
  };
  if (payload.title.length < 3 || payload.description.length < 10) {
    errorBox.textContent = "O título deve possuir ao menos 3 caracteres e a descrição, ao menos 10.";
    return;
  }

  createButton.disabled = true;
  createButton.textContent = "Registrando...";
  try {
    await createIncident(payload);
    form.reset();
    successBox.textContent = "Incidente registrado com sucesso no banco de dados.";
    await render();
  } catch (error) {
    errorBox.textContent = error.message || "Não foi possível registrar o incidente.";
  } finally {
    createButton.disabled = false;
    createButton.textContent = "Registrar incidente";
  }
});

tableBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.statusId) {
    button.disabled = true;
    try {
      await updateIncidentStatus(button.dataset.statusId, button.dataset.nextStatus);
      await render();
    } catch (error) {
      listError.textContent = error.message || "Não foi possível atualizar o status.";
      button.disabled = false;
    }
    return;
  }

  if (button.dataset.archiveId) {
    const confirmed = window.confirm("Arquivar este incidente? O registro será ocultado da lista, mas permanecerá preservado na trilha do banco de dados.");
    if (!confirmed) return;
    button.disabled = true;
    try {
      await archiveIncident(button.dataset.archiveId);
      await render();
    } catch (error) {
      listError.textContent = error.message || "Não foi possível arquivar o incidente.";
      button.disabled = false;
    }
  }
});

let searchTimer;
document.getElementById("searchIncident").addEventListener("input", () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(render, 250);
});
document.getElementById("filterSeverity").addEventListener("change", render);
document.getElementById("filterStatus").addEventListener("change", render);

await render();
