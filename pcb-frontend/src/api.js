// src/api.js — Centralized API helper for backend communication
const API_BASE = "http://localhost:5000";

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders(isJSON = true) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (isJSON) headers["Content-Type"] = "application/json";
  return headers;
}

// ── Field mappers: backend snake_case ↔ frontend camelCase ──

function mapComponentFromAPI(row) {
  return {
    id: row.id,
    name: row.name || "",
    partNumber: row.part_number || "",
    category: row.category || "",
    stock: row.current_stock ?? 0,
    monthlyRequired: row.monthly_required_quantity ?? 0,
  };
}

function mapComponentToAPI(form) {
  return {
    name: form.name,
    part_number: form.partNumber,
    current_stock: Number(form.stock) || 0,
    monthly_required_quantity: Number(form.monthlyRequired) || 0,
  };
}

function mapPCBFromAPI(row) {
  return {
    id: row.id,
    name: row.pcb_name || "",
    description: row.description || "",
    bom: Array.isArray(row.components)
      ? row.components
        .filter((c) => c.component_id)
        .map((c) => ({
          compId: c.component_id,
          qty: c.quantity_required || 0,
          rowId: c.pcb_component_id || null,
        }))
      : [],
  };
}

function mapProductionFromAPI(row) {
  const d = row.production_date ? new Date(row.production_date) : new Date();
  return {
    id: row.id,
    pcbId: row.pcb_id,
    pcbName: row.pcb_name || `PCB #${row.pcb_id}`,
    quantity: row.quantity_produced,
    date: d.toISOString().split("T")[0],
    time: d.toLocaleTimeString(),
    batch: row.batch || "",
    componentsUsed: row.components_consumed || "—",
  };
}

// ── API Functions ──

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data; // { message, token, user }
}

export async function register(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  return data; // { message, user }
}

// — Components —

export async function fetchComponents() {
  const res = await fetch(`${API_BASE}/components`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch components");
  return (data.components || []).map(mapComponentFromAPI);
}

export async function addComponent(form) {
  const res = await fetch(`${API_BASE}/components`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(mapComponentToAPI(form)),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to add component");
  return mapComponentFromAPI(data.component);
}

export async function updateComponent(id, form) {
  const res = await fetch(`${API_BASE}/components/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(mapComponentToAPI(form)),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update component");
  return mapComponentFromAPI(data.component);
}

export async function deleteComponent(id) {
  const res = await fetch(`${API_BASE}/components/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete component");
  return data;
}

// — PCBs —

export async function fetchPCBs() {
  const res = await fetch(`${API_BASE}/pcbs`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch PCBs");
  return (data.pcbs || []).map(mapPCBFromAPI);
}

export async function createPCB(pcbName, description) {
  const res = await fetch(`${API_BASE}/pcbs`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ pcb_name: pcbName, description }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create PCB");
  return mapPCBFromAPI(data.pcb);
}

export async function deletePCB(id) {
  const res = await fetch(`${API_BASE}/pcbs/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete PCB");
  return data;
}

// — BOM Row Management —

export async function addBOMRow(pcbId, componentId, quantityRequired) {
  const res = await fetch(`${API_BASE}/pcbs/${pcbId}/bom`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ component_id: componentId, quantity_required: quantityRequired }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to add BOM row");
  return data;
}

export async function removeBOMRow(pcbId, rowId) {
  const res = await fetch(`${API_BASE}/pcbs/${pcbId}/bom/${rowId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to remove BOM row");
  return data;
}

export async function updateBOMQty(pcbId, rowId, quantityRequired) {
  const res = await fetch(`${API_BASE}/pcbs/${pcbId}/bom/${rowId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ quantity_required: quantityRequired }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update BOM row");
  return data;
}

// — Production —

export async function recordProduction(pcbId, quantityProduced) {
  const res = await fetch(`${API_BASE}/production/add`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ pcb_id: pcbId, quantity_produced: quantityProduced }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to record production");
  return data;
}

export async function fetchProductionHistory() {
  const res = await fetch(`${API_BASE}/production`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch production history");
  return (data.entries || []).map(mapProductionFromAPI);
}

// — Analytics —

export async function fetchLowStock() {
  const res = await fetch(`${API_BASE}/analytics/low-stock`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch low stock");
  return (data.components || []).map(mapComponentFromAPI);
}

export async function fetchTopConsumed() {
  const res = await fetch(`${API_BASE}/analytics/top-consumed`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch top consumed");
  return (data.components || []).map(mapComponentFromAPI);
}

// — Excel Import —

export async function importComponentsFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/excel/import-components`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to import components");
  return data;
}

export async function importBOMFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/excel/import-bom`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to import BOM");
  return data;
}
