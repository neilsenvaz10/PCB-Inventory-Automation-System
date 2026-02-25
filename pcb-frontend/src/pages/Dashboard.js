import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import { fetchComponents, fetchPCBs, fetchProductionHistory } from "../api";

export default function Dashboard() {
  const [components, setComponents] = useState([]);
  const [pcbs, setPcbs] = useState([]);
  const [production, setProduction] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    fetchComponents().then(setComponents).catch(console.error);
    fetchPCBs().then(setPcbs).catch(console.error);
    fetchProductionHistory().then(setProduction).catch(console.error);
  }, []);

  /* ── KPI calculations ── */
  const totalStock = components.reduce((s, c) => s + c.stock, 0);
  const lowStockItems = components.filter((c) => c.stock <= c.monthlyRequired);
  const monthlyConsumption = components.reduce((s, c) => s + c.monthlyRequired, 0);
  const totalProduced = production.reduce((s, p) => s + p.quantity, 0);

  /* ── Chart data: stock vs monthly required per component ── */
  const maxVal = Math.max(...components.map((c) => Math.max(c.stock, c.monthlyRequired)), 1);

  /* ── Health score ── */
  const healthyCount = components.filter((c) => c.stock > c.monthlyRequired).length;
  const healthPct = components.length ? Math.round((healthyCount / components.length) * 100) : 0;

  return (
    <div className="dashboard container">
      {/* ── KPI Cards ── */}
      <div className="cards-row">
        <Card title="Total Stock Units">
          <div className="card-value">{totalStock.toLocaleString()}</div>
          <div className="card-meta">
            <div className="trend" style={{ color: "#10b981" }}>📦 {components.length} component types</div>
          </div>
        </Card>
        <Card title="Low Stock Items">
          <div className="card-value" style={{ color: lowStockItems.length > 0 ? "#ef4444" : "#10b981" }}>
            {lowStockItems.length}
          </div>
          <div className="card-meta">
            <div className="trend" style={{ color: "#f97316" }}>⚠️ {lowStockItems.length > 0 ? "Action required" : "All healthy"}</div>
          </div>
        </Card>
        <Card title="Monthly Consumption">
          <div className="card-value">{monthlyConsumption.toLocaleString()}</div>
          <div className="card-meta">
            <div className="trend" style={{ color: "#10b981" }}>📈 Units/month target</div>
          </div>
        </Card>
        <Card title="Active PCB Types">
          <div className="card-value">{pcbs.length}</div>
          <div className="card-meta">
            <div className="trend" style={{ color: "#64748b" }}>🗂️ {totalProduced} boards produced</div>
          </div>
        </Card>
      </div>

      {/* ── Main Grid ── */}
      <div className="main-grid">
        {/* LEFT — Chart + Table */}
        <div className="left">
          <Card title="Stock vs Monthly Required" className="chart">
            <div className="dash-chart">
              {components.map((c) => (
                <div className="dash-chart-row" key={c.id}>
                  <div className="dash-chart-label">{c.name}</div>
                  <div className="dash-chart-bars">
                    <div className="dash-bar-track">
                      <div
                        className="dash-bar stock"
                        style={{ width: `${(c.stock / maxVal) * 100}%` }}
                      >
                        {c.stock}
                      </div>
                    </div>
                    <div className="dash-bar-track">
                      <div
                        className="dash-bar required"
                        style={{ width: `${(c.monthlyRequired / maxVal) * 100}%` }}
                      >
                        {c.monthlyRequired}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="dash-chart-legend">
                <span><span className="dot stock" /> Current Stock</span>
                <span><span className="dot required" /> Monthly Required</span>
              </div>
            </div>
          </Card>

          <Card title="All Components">
            <table className="table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Part Number</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Monthly Req.</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {components.map((c) => {
                  const ratio = c.stock / c.monthlyRequired;
                  let status = "ok";
                  let label = "Healthy";
                  if (ratio <= 0.5) { status = "critical"; label = "Critical"; }
                  else if (ratio <= 1) { status = "low"; label = "Low"; }
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td><span className="chip">{c.partNumber}</span></td>
                      <td>{c.category}</td>
                      <td style={{ fontWeight: 700 }}>{c.stock}</td>
                      <td>{c.monthlyRequired}</td>
                      <td><span className={`status-chip ${status}`}>{label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>

        {/* RIGHT — Alerts + Health */}
        <div className="right">
          <div className="card alerts-panel">
            <div style={{ padding: "18px" }}>
              <div className="card-header"><h4>⚠️ Critical Stock Alerts</h4></div>
              <div className="alert-list">
                {lowStockItems.length === 0 && (
                  <div style={{ padding: 16, textAlign: "center", color: "#10b981", fontWeight: 600 }}>
                    ✅ All stock levels are healthy
                  </div>
                )}
                {lowStockItems.map((a) => (
                  <div key={a.id} className={`alert-item ${a.stock <= a.monthlyRequired / 2 ? "critical" : ""}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div className="title">{a.name}</div>
                        <div className="meta">PN: {a.partNumber}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="qty">{a.stock} Units</div>
                        <div style={{ marginTop: 4 }}>
                          <span className={`status-chip ${a.stock <= a.monthlyRequired / 2 ? "critical" : "low"}`}>
                            {a.stock <= a.monthlyRequired / 2 ? "CRITICAL" : "LOW"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {lowStockItems.length > 0 && (
              <div className="alert-footer">
                <button className="btn primary" onClick={() => nav("/low-stock")}>View All Alerts</button>
              </div>
            )}
          </div>

          {/* Inventory Health */}
          <div className="card" style={{ padding: 18, marginTop: 16 }}>
            <div className="card-header"><h4>📊 Inventory Health</h4></div>
            <div className="health-ring-wrap">
              <div className="health-ring">
                <svg viewBox="0 0 36 36" className="health-svg">
                  <path className="health-bg" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="health-fg" strokeDasharray={`${healthPct}, 100`} d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="health-pct">{healthPct}%</div>
              </div>
              <div className="health-label">Components at healthy stock levels</div>
            </div>
            <div className="health-breakdown">
              <div><span className="dot ok" /> Healthy: {healthyCount}</div>
              <div><span className="dot low" /> Low: {lowStockItems.filter(c => c.stock > c.monthlyRequired / 2).length}</div>
              <div><span className="dot critical" /> Critical: {lowStockItems.filter(c => c.stock <= c.monthlyRequired / 2).length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
