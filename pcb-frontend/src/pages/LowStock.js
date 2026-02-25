import React, { useEffect, useState } from "react";
import ExcelJS from "exceljs";
import { fetchComponents, updateComponent } from "../api";

export default function LowStock() {
  const [components, setComponents] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("urgency");
  const [reorderQty, setReorderQty] = useState({});
  const [showReorder, setShowReorder] = useState(null);

  useEffect(() => {
    loadComponents();
  }, []);

  async function loadComponents() {
    try {
      const comps = await fetchComponents();
      setComponents(comps);
    } catch (err) {
      console.error("Failed to load components:", err);
    }
  }

  /* ── Build alerts from components that are at or below monthly required ── */
  const alerts = components
    .filter((c) => c.stock <= c.monthlyRequired)
    .map((c) => {
      const ratio = c.monthlyRequired > 0 ? c.stock / c.monthlyRequired : 1;
      let status = "LOW";
      if (ratio <= 0.25) status = "CRITICAL";
      else if (ratio <= 0.5) status = "WARNING";
      const deficit = c.monthlyRequired - c.stock;
      return {
        id: c.id,
        name: c.name,
        partNumber: c.partNumber,
        category: c.category || "—",
        stock: c.stock,
        required: c.monthlyRequired,
        ratio,
        pct: Math.round(ratio * 100),
        status,
        deficit,
      };
    });

  /* ── Filter ── */
  const filtered = alerts.filter((a) => {
    if (filter === "all") return true;
    return a.status === filter.toUpperCase();
  });

  /* ── Sort ── */
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "urgency") return a.ratio - b.ratio;
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "stock") return a.stock - b.stock;
    if (sort === "deficit") return b.deficit - a.deficit;
    return 0;
  });

  /* ── Reorder (add stock) ── */
  async function handleReorder(alertItem) {
    const addQty = parseInt(reorderQty[alertItem.id]) || alertItem.required;
    const comp = components.find((c) => c.id === alertItem.id);
    if (!comp) return;
    try {
      await updateComponent(comp.id, { ...comp, stock: String(comp.stock + addQty) });
      await loadComponents();
    } catch (err) {
      window.alert(err.message || "Reorder failed");
    }
    setShowReorder(null);
    setReorderQty({});
  }

  /* ── Reorder all critical ── */
  async function reorderAllCritical() {
    const critItems = alerts.filter((a) => a.status === "CRITICAL");
    if (critItems.length === 0) return window.alert("No critical items to reorder.");
    if (!window.confirm(`Reorder ${critItems.length} critical items to full stock levels?`)) return;
    try {
      for (const a of critItems) {
        const comp = components.find((c) => c.id === a.id);
        if (comp) await updateComponent(comp.id, { ...comp, stock: String(comp.stock + comp.monthlyRequired) });
      }
      await loadComponents();
    } catch (err) {
      window.alert(err.message || "Reorder failed");
    }
  }

  /* ── Export shortage report as XLSX ── */
  async function exportReport() {
    if (alerts.length === 0) return alert("No alerts to export.");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Shortage Report");

    const headers = ["Component", "Part Number", "Category", "Current Stock", "Required", "Deficit", "Status"];
    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B5FFF" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center" };
    });

    alerts.forEach((a) => worksheet.addRow([a.name, a.partNumber, a.category, a.stock, a.required, a.deficit, a.status]));

    worksheet.columns.forEach((col, i) => {
      let maxLen = (headers[i] || "").length;
      alerts.forEach((a) => {
        const vals = [a.name, a.partNumber, a.category, String(a.stock), String(a.required), String(a.deficit), a.status];
        if (vals[i] && vals[i].length > maxLen) maxLen = vals[i].length;
      });
      col.width = Math.min(maxLen + 4, 40);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "shortage_report.xlsx";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ── KPI counts ── */
  const criticalCount = alerts.filter((a) => a.status === "CRITICAL").length;
  const warningCount = alerts.filter((a) => a.status === "WARNING").length;
  const lowCount = alerts.filter((a) => a.status === "LOW").length;
  const totalDeficit = alerts.reduce((s, a) => s + a.deficit, 0);

  /* ── Status bar color ── */
  function barColor(status) {
    if (status === "CRITICAL") return "#ef4444";
    if (status === "WARNING") return "#f59e0b";
    return "#3b82f6";
  }

  return (
    <div className="container">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <div className="breadcrumbs">Inventory &gt; <strong>LOW STOCK ALERTS</strong></div>
          <h1>Low Stock Alerts</h1>
          <p className="muted">Action required for components falling below critical thresholds.</p>
        </div>
        <div className="header-actions">
          <button className="btn" onClick={exportReport}>⬇ Shortage Report</button>
          <button className="btn primary" onClick={reorderAllCritical}>🚨 Reorder All Critical</button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="kpis">
        <div className="kpi card">
          <div className="kpi-title">CRITICAL</div>
          <div className="kpi-value" style={{ color: "#ef4444" }}>{criticalCount}</div>
        </div>
        <div className="kpi card">
          <div className="kpi-title">WARNING</div>
          <div className="kpi-value" style={{ color: "#f59e0b" }}>{warningCount}</div>
        </div>
        <div className="kpi card">
          <div className="kpi-title">LOW</div>
          <div className="kpi-value" style={{ color: "#3b82f6" }}>{lowCount}</div>
        </div>
        <div className="kpi card">
          <div className="kpi-title">TOTAL DEFICIT</div>
          <div className="kpi-value">{totalDeficit.toLocaleString()}</div>
        </div>
      </div>

      {/* ── Filter + Sort ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={`btn ${filter === "all" ? "primary" : ""}`} onClick={() => setFilter("all")}>All ({alerts.length})</button>
          <button className={`btn ${filter === "critical" ? "primary" : ""}`} onClick={() => setFilter("critical")}>Critical ({criticalCount})</button>
          <button className={`btn ${filter === "warning" ? "primary" : ""}`} onClick={() => setFilter("warning")}>Warning ({warningCount})</button>
          <button className={`btn ${filter === "low" ? "primary" : ""}`} onClick={() => setFilter("low")}>Low ({lowCount})</button>
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #e6eef6", fontSize: 13 }}>
          <option value="urgency">Sort: Urgency</option>
          <option value="name">Sort: Name A–Z</option>
          <option value="stock">Sort: Lowest Stock</option>
          <option value="deficit">Sort: Largest Deficit</option>
        </select>
      </div>

      {/* ── Alert Cards ── */}
      {sorted.length === 0 && (
        <div className="card" style={{ padding: 48, textAlign: "center", color: "#10b981" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>All stock levels are healthy!</div>
          <div className="muted" style={{ marginTop: 6 }}>No components are below their required thresholds.</div>
        </div>
      )}

      <div className="alerts-grid">
        {sorted.map((a) => (
          <div key={a.id} className={`alert-card ${a.status.toLowerCase()}`}>
            {/* Top row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                  <span className="chip" style={{ marginRight: 8 }}>{a.partNumber}</span>
                  {a.category}
                </div>
              </div>
              <div>
                <span className={`status-chip ${a.status.toLowerCase()}`}>{a.status}</span>
              </div>
            </div>

            {/* Stock info */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 13, color: "#475569" }}>
              <span>Current: <strong>{a.stock}</strong></span>
              <span>Required: <strong>{a.required}</strong></span>
              <span>Deficit: <strong style={{ color: "#ef4444" }}>-{a.deficit}</strong></span>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: 10 }}>
              <div style={{ height: 8, background: "#f1f5f9", borderRadius: 6, overflow: "hidden" }}>
                <div style={{
                  width: `${Math.max(4, a.pct)}%`,
                  height: 8,
                  background: barColor(a.status),
                  borderRadius: 6,
                  transition: "width 0.4s ease"
                }} />
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{a.pct}% of required threshold</div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {showReorder === a.id ? (
                <>
                  <input
                    type="number"
                    min="1"
                    placeholder={`Qty (default: ${a.required})`}
                    value={reorderQty[a.id] || ""}
                    onChange={(e) => setReorderQty({ ...reorderQty, [a.id]: e.target.value })}
                    style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid #e6eef6", fontSize: 13 }}
                  />
                  <button className="btn primary" onClick={() => handleReorder(a)}>Confirm</button>
                  <button className="btn" onClick={() => setShowReorder(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <button className="btn primary" style={{ flex: 1 }} onClick={() => setShowReorder(a.id)}>🔄 Quick Reorder</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Summary Table ── */}
      {alerts.length > 0 && (
        <div className="card" style={{ marginTop: 20, padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>Alert Summary Table</h3>
          <table className="mapping-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Part Number</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Required</th>
                <th>Deficit</th>
                <th>Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 700 }}>{a.name}</td>
                  <td><span className="chip">{a.partNumber}</span></td>
                  <td>{a.category}</td>
                  <td style={{ fontWeight: 700 }}>{a.stock}</td>
                  <td>{a.required}</td>
                  <td style={{ color: "#ef4444", fontWeight: 600 }}>-{a.deficit}</td>
                  <td>
                    <div style={{ width: 60, height: 6, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${Math.max(4, a.pct)}%`, height: 6, background: barColor(a.status), borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{a.pct}%</div>
                  </td>
                  <td><span className={`status-chip ${a.status.toLowerCase()}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
