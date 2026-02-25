import React, { useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs";
import { fetchComponents, fetchPCBs, fetchProductionHistory } from "../api";

export default function Reports() {
  const [components, setComponents] = useState([]);
  const [production, setProduction] = useState([]);
  const [pcbs, setPcbs] = useState([]);
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [tab, setTab] = useState("inventory");
  const [page, setPage] = useState(1);
  const perPage = 8;

  useEffect(() => {
    fetchComponents().then(setComponents).catch(console.error);
    fetchProductionHistory().then(setProduction).catch(console.error);
    fetchPCBs().then(setPcbs).catch(console.error);
  }, []);

  /* ── Categories ── */
  const categories = useMemo(() => {
    const set = new Set(components.map((c) => c.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [components]);

  /* ── KPIs ── */
  const totalStock = components.reduce((s, c) => s + (c.stock || 0), 0);
  const totalRequired = components.reduce((s, c) => s + (c.monthlyRequired || 0), 0);
  const lowStockCount = components.filter((c) => c.stock <= c.monthlyRequired).length;
  const totalProduced = production.reduce((s, h) => s + h.quantity, 0);
  const healthyPct = components.length ? Math.round((components.filter((c) => c.stock > c.monthlyRequired).length / components.length) * 100) : 0;

  /* ── Top category by monthly required ── */
  const catTotals = {};
  components.forEach((c) => { catTotals[c.category || "General"] = (catTotals[c.category || "General"] || 0) + c.monthlyRequired; });
  const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  /* ── Filtered data for inventory tab ── */
  const filteredComps = components.filter((c) => {
    if (catFilter !== "All" && c.category !== catFilter) return false;
    if (statusFilter !== "All") {
      const ratio = c.stock / c.monthlyRequired;
      if (statusFilter === "Healthy" && ratio <= 1) return false;
      if (statusFilter === "Low" && (ratio > 1 || ratio <= 0.5)) return false;
      if (statusFilter === "Critical" && ratio > 0.5) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredComps.length / perPage));
  const pagedComps = filteredComps.slice((page - 1) * perPage, page * perPage);

  /* ── Export XLSX ── */
  async function exportXLSX() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(tab === "inventory" ? "Inventory Report" : "Production Report");

    let headers, rows;
    if (tab === "inventory") {
      headers = ["Component", "Part Number", "Category", "Stock", "Monthly Required", "Status"];
      rows = filteredComps.map((c) => {
        const ratio = c.stock / c.monthlyRequired;
        const status = ratio > 1 ? "Healthy" : ratio > 0.5 ? "Low" : "Critical";
        return [c.name, c.partNumber, c.category, c.stock, c.monthlyRequired, status];
      });
    } else {
      headers = ["Date", "Time", "PCB Model", "Batch", "Quantity"];
      rows = production.map((h) => [h.date, h.time || "", h.pcbName || `PCB #${h.pcbId}`, h.batch || "", h.quantity]);
    }

    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B5FFF" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center" };
    });

    rows.forEach((r) => worksheet.addRow(r));

    worksheet.columns.forEach((col, i) => {
      let maxLen = (headers[i] || "").length;
      rows.forEach((r) => { const val = String(r[i] ?? ""); if (val.length > maxLen) maxLen = val.length; });
      col.width = Math.min(maxLen + 4, 40);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${tab}_report.xlsx`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ── Chart: stock distribution by category (horizontal bars) ── */
  const catStockData = useMemo(() => {
    const map = {};
    components.forEach((c) => {
      const cat = c.category || "General";
      if (!map[cat]) map[cat] = { stock: 0, required: 0 };
      map[cat].stock += c.stock;
      map[cat].required += c.monthlyRequired;
    });
    return Object.entries(map).map(([cat, data]) => ({ cat, ...data }));
  }, [components]);
  const maxCatVal = Math.max(...catStockData.map((d) => Math.max(d.stock, d.required)), 1);

  /* ── Chart: production by PCB (pie-like summary) ── */
  const prodByPcb = useMemo(() => {
    const map = {};
    production.forEach((h) => {
      const name = h.pcbName || `PCB #${h.pcbId}`;
      map[name] = (map[name] || 0) + h.quantity;
    });
    return Object.entries(map).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty);
  }, [production]);
  const totalProdQty = prodByPcb.reduce((s, p) => s + p.qty, 0) || 1;

  const barColors = ["#0b5fff", "#10b981", "#f97316", "#8b5cf6", "#ec4899", "#06b6d4"];

  return (
    <div className="container reports-page">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <div className="breadcrumbs">Inventory &gt; <strong>REPORTS</strong></div>
          <h1>Inventory &amp; Production Reports</h1>
          <p className="muted">Last data sync: {new Date().toLocaleString()}</p>
        </div>
        <div className="header-actions">
          <button className="btn" onClick={exportXLSX}>⬇ Export XLSX</button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="kpis">
        <div className="kpi card"><div className="kpi-title">TOTAL STOCK</div><div className="kpi-value">{totalStock.toLocaleString()}</div></div>
        <div className="kpi card"><div className="kpi-title">MONTHLY REQUIRED</div><div className="kpi-value">{totalRequired.toLocaleString()}</div></div>
        <div className="kpi card"><div className="kpi-title">LOW STOCK ITEMS</div><div className="kpi-value" style={{ color: lowStockCount > 0 ? "#ef4444" : "#10b981" }}>{lowStockCount}</div></div>
        <div className="kpi card"><div className="kpi-title">TOTAL PRODUCED</div><div className="kpi-value">{totalProduced.toLocaleString()}</div></div>
        <div className="kpi card"><div className="kpi-title">HEALTH SCORE</div><div className="kpi-value" style={{ color: healthyPct >= 70 ? "#10b981" : "#f59e0b" }}>{healthyPct}%</div></div>
        <div className="kpi card"><div className="kpi-title">TOP CATEGORY</div><div className="kpi-value" style={{ fontSize: 16 }}>{topCategory}</div></div>
      </div>

      {/* ── Charts Row ── */}
      <div className="main-grid" style={{ marginTop: 16 }}>
        <div className="left">
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>Stock by Category</h3>
            <div className="dash-chart">
              {catStockData.map((d, i) => (
                <div className="dash-chart-row" key={d.cat}>
                  <div className="dash-chart-label">{d.cat}</div>
                  <div className="dash-chart-bars">
                    <div className="dash-bar-track">
                      <div className="dash-bar stock" style={{ width: `${(d.stock / maxCatVal) * 100}%`, background: barColors[i % barColors.length] }}>{d.stock}</div>
                    </div>
                    <div className="dash-bar-track">
                      <div className="dash-bar required" style={{ width: `${(d.required / maxCatVal) * 100}%` }}>{d.required}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="dash-chart-legend">
                <span><span className="dot stock" /> Current Stock</span>
                <span><span className="dot required" /> Monthly Required</span>
              </div>
            </div>
          </div>
        </div>

        <div className="right">
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>Production by PCB Model</h3>
            {prodByPcb.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No production data yet.</div>
            ) : (
              <div>
                {prodByPcb.map((p, i) => {
                  const pct = Math.round((p.qty / totalProdQty) * 100);
                  return (
                    <div key={p.name} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                        <span>{p.name}</span>
                        <span>{p.qty.toLocaleString()} units ({pct}%)</span>
                      </div>
                      <div style={{ height: 10, background: "#f1f5f9", borderRadius: 6, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: 10, background: barColors[i % barColors.length], borderRadius: 6, transition: "width 0.4s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Inventory Health Ring */}
          <div className="card" style={{ padding: 18, marginTop: 16 }}>
            <h4 style={{ marginTop: 0 }}>📊 Inventory Health</h4>
            <div className="health-ring-wrap">
              <div className="health-ring">
                <svg viewBox="0 0 36 36" className="health-svg">
                  <path className="health-bg" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="health-fg" strokeDasharray={`${healthyPct}, 100`} d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="health-pct">{healthyPct}%</div>
              </div>
              <div className="health-label">Healthy stock levels</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <button className={`btn ${tab === "inventory" ? "primary" : ""}`} onClick={() => { setTab("inventory"); setPage(1); }}>📦 Inventory Report</button>
        <button className={`btn ${tab === "production" ? "primary" : ""}`} onClick={() => { setTab("production"); setPage(1); }}>🏭 Production Report</button>
      </div>

      {/* ── Inventory Report Tab ── */}
      {tab === "inventory" && (
        <div className="card" style={{ marginTop: 12, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0 }}>Component Inventory Details</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #e6eef6" }}>
                {categories.map((c) => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #e6eef6" }}>
                <option value="All">All Status</option>
                <option value="Healthy">Healthy</option>
                <option value="Low">Low</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
          <table className="mapping-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Part Number</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Monthly Required</th>
                <th>Usage Ratio</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pagedComps.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No components match filters.</td></tr>
              )}
              {pagedComps.map((c) => {
                const ratio = c.monthlyRequired > 0 ? c.stock / c.monthlyRequired : 999;
                const status = ratio > 1 ? "Healthy" : ratio > 0.5 ? "Low" : "Critical";
                const statusClass = ratio > 1 ? "ok" : ratio > 0.5 ? "low" : "critical";
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700 }}>{c.name}</td>
                    <td><span className="chip">{c.partNumber}</span></td>
                    <td>{c.category}</td>
                    <td style={{ fontWeight: 700 }}>{c.stock}</td>
                    <td>{c.monthlyRequired}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 60, height: 6, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(100, ratio * 100)}%`, height: 6, borderRadius: 4, background: statusClass === "ok" ? "#10b981" : statusClass === "low" ? "#f59e0b" : "#ef4444" }} />
                        </div>
                        <span style={{ fontSize: 11, color: "#64748b" }}>{Math.round(ratio * 100)}%</span>
                      </div>
                    </td>
                    <td><span className={`status-chip ${statusClass}`}>{status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="table-footer">
            <div>Showing {filteredComps.length > 0 ? (page - 1) * perPage + 1 : 0}–{Math.min(page * perPage, filteredComps.length)} of {filteredComps.length}</div>
            <div className="pagination">
              <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>&lt;</button>
              {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => (
                <button key={i} className={i + 1 === page ? "btn primary" : "btn"} onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
              <button className="btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>&gt;</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Production Report Tab ── */}
      {tab === "production" && (
        <div className="card" style={{ marginTop: 12, padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>Production History</h3>
          <table className="mapping-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>PCB Model</th>
                <th>Batch</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {production.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No production records yet.</td></tr>
              )}
              {production.map((h) => (
                <tr key={h.id}>
                  <td style={{ fontWeight: 600 }}>{h.date}</td>
                  <td>{h.time || "—"}</td>
                  <td><strong>{h.pcbName || `PCB #${h.pcbId}`}</strong></td>
                  <td><span className="chip">{h.batch || `BATCH-${h.id}`}</span></td>
                  <td style={{ fontWeight: 700 }}>{h.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
