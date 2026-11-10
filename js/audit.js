import { getAudit, initShell, formatDate } from "./store.js";

const user = await initShell();
if (!user) throw new Error("Sessão não autenticada.");

const tableBody = document.getElementById("auditTable");
const emptyState = document.getElementById("auditEmpty");
const errorBox = document.getElementById("auditError");

function createCell(value) {
  const cell = document.createElement("td");
  cell.textContent = String(value ?? "");
  return cell;
}

function formatDetails(value) {
  if (value == null) return "—";
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value));
    } catch {
      return value;
    }
  }
  try {
    return JSON.stringify(value);
  } catch {
    return "Detalhes indisponíveis";
  }
}

try {
  const events = await getAudit(200);
  emptyState.hidden = events.length > 0;
  tableBody.replaceChildren();

  for (const entry of events) {
    const row = document.createElement("tr");
    row.append(
      createCell(formatDate(entry.createdAt)),
      createCell(entry.user),
      createCell(entry.event),
      createCell(`${entry.entity || "—"}${entry.entityId ? ` · ${entry.entityId}` : ""}`),
      createCell(formatDetails(entry.details)),
      createCell(entry.ip || "—")
    );
    tableBody.append(row);
  }
} catch (error) {
  emptyState.hidden = false;
  emptyState.textContent = "Não foi possível carregar a trilha de auditoria.";
  errorBox.textContent = error.message || "Falha ao consultar o servidor.";
}
