import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchComponents, fetchPCBs, recordProduction, fetchProductionHistory } from "../api";

export default function ProductionEntry() {
  const [pcbs, setPcbs] = useState([]);
  const [components, setComponents] = useState([]);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState("");
  const [batch, setBatch] = useState("");
  const [qty, setQty] = useState(100);
  const [preview, setPreview] = useState([]);
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [comps, pcbList, prod] = await Promise.all([
        fetchComponents(),
        fetchPCBs(),
        fetchProductionHistory(),
      ]);
      setComponents(comps);
      setPcbs(pcbList);
      setHistory(prod);
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  }

  /* ── Build deduction preview whenever PCB or qty changes ── */
  useEffect(() => {
    if (!selected || qty <= 0) { setPreview([]); return; }
    const pcb = pcbs.find((p) => String(p.id) === String(selected));
    if (!pcb || !pcb.bom) { setPreview([]); return; }
    const table = pcb.bom.map((item) => {
      const comp = components.find((c) => c.id === item.compId) || { name: "Unknown", partNumber: "--", stock: 0, category: "" };
      const required = item.qty * qty;
      return {
        id: item.compId,
        component: comp.name,
        partNumber: comp.partNumber,
        category: comp.category || "",
        qtyPerUnit: item.qty,
        required,
        stock: comp.stock,
        projected: comp.stock - required,
      };
    });
    setPreview(table);
  }, [selected, qty, pcbs, components]);

  /* ── Submit production ── */
  async function handleSubmit() {
    if (!selected) return;
    if (!batch.trim()) return alert("Please enter a batch number.");
    if (qty <= 0) return alert("Quantity must be greater than zero.");

    const negatives = preview.filter((p) => p.projected < 0);
    if (negatives.length > 0) {
      const names = negatives.map((n) => n.component).join(", ");
      if (!window.confirm(`Warning: ${names} will have insufficient stock. Continue anyway?`)) return;
    }

    setSubmitting(true);
    try {
      const pcb = pcbs.find((p) => String(p.id) === String(selected));
      await recordProduction(parseInt(selected), qty);
      setSuccess(`✅ Production batch "${batch}" recorded — ${qty} units of ${pcb?.name}. Stocks updated.`);
      setSelected("");
      setBatch("");
      setQty(100);
      setPreview([]);
      // Refresh data from API
      await loadData();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      alert(err.message || "Production recording failed");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── KPI calculations ── */
  const totalProduced = history.reduce((s, h) => s + h.quantity, 0);
  const todayStr = new Date().toISOString().split("T")[0];
  const todayProduced = history.filter((h) => h.date === todayStr).reduce((s, h) => s + h.quantity, 0);
  const lowStockCount = components.filter((c) => c.stock <= c.monthlyRequired).length;
  const hasShortage = preview.some((p) => p.projected < 0);

  return (
    <div className="container">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <div className="breadcrumbs">Dashboard &gt; Inventory &gt; <strong>PRODUCTION ENTRY</strong></div>
          <h1>Production Entry</h1>
          <p className="muted">Record manufacturing output to automatically synchronize component inventory.</p>
        </div>
        <div className="header-actions">
          <button className="btn" onClick={() => nav("/low-stock")}>⚠ Stock Alerts ({lowStockCount})</button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="kpis">
        <div className="kpi card"><div className="kpi-title">TOTAL BATCHES</div><div className="kpi-value">{history.length}</div></div>
        <div className="kpi card"><div className="kpi-title">TOTAL PRODUCED</div><div className="kpi-value">{totalProduced.toLocaleString()}</div></div>
        <div className="kpi card"><div className="kpi-title">TODAY'S OUTPUT</div><div className="kpi-value">{todayProduced.toLocaleString()}</div></div>
        <div className="kpi card"><div className="kpi-title">LOW STOCK ITEMS</div><div className="kpi-value" style={{ color: lowStockCount > 0 ? "#ef4444" : "#10b981" }}>{lowStockCount}</div></div>
      </div>

      {success && <div className="auth-success" style={{ marginBottom: 16 }}>{success}</div>}

      <div className="production-layout">
        {/* ── LEFT: Form ── */}
        <div className="left-col">
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>Record Daily Production</h3>

            <div className="form-row">
              <label>Select PCB Model</label>
              <select value={selected} onChange={(e) => setSelected(e.target.value)}>
                <option value="">-- Select PCB --</option>
                {pcbs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="form-row">
              <label>Production Batch Number</label>
              <input placeholder="e.g. BATCH-2026-02-15" value={batch} onChange={(e) => setBatch(e.target.value)} />
            </div>

            <div className="form-row">
              <label>Quantity Produced</label>
              <input type="number" min="1" value={qty} onChange={(e) => setQty(parseInt(e.target.value || 0))} />
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Deduction preview updates automatically.</div>
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button
                className="btn primary"
                onClick={handleSubmit}
                disabled={!preview.length || submitting}
                style={{ flex: 1 }}
              >
                {submitting ? "Submitting..." : "Submit Production"}
              </button>
              <button className="btn" onClick={() => { setSelected(""); setBatch(""); setQty(100); setPreview([]); }}>Reset</button>
            </div>

            {hasShortage && (
              <div className="auth-error" style={{ marginTop: 12 }}>
                ⚠ Some components have insufficient stock for this batch size.
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 16, marginTop: 16 }}>
            <h4 style={{ marginTop: 0 }}>ℹ️ Quick Tips</h4>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#64748b", fontSize: 13, lineHeight: 1.8 }}>
              <li>Ensure all batches are logged before 5 PM for daily reports</li>
              <li>Red rows indicate insufficient stock for the requested quantity</li>
              <li>Submitted production immediately deducts from inventory</li>
            </ul>
          </div>
        </div>

        {/* ── RIGHT: Deduction Preview ── */}
        <div className="right-col">
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Real-time Deduction Preview</h3>
              <div className="muted" style={{ fontSize: 13 }}>
                {preview.length > 0 ? `Calculated for ${qty} units` : ""}
              </div>
            </div>

            <table className="mapping-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Part No.</th>
                  <th>Qty/Unit</th>
                  <th>Total Deduction</th>
                  <th>Current Stock</th>
                  <th>Projected Stock</th>
                </tr>
              </thead>
              <tbody>
                {preview.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Select a PCB and enter a quantity to see deduction preview</td></tr>
                )}
                {preview.map((r) => {
                  const isNeg = r.projected < 0;
                  const isWarn = r.projected >= 0 && r.projected < r.qtyPerUnit * 5;
                  return (
                    <tr key={r.id} style={isNeg ? { background: "#fef2f2" } : isWarn ? { background: "#fffbeb" } : {}}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{r.component}</div>
                        <div className="muted" style={{ fontSize: 11 }}>{r.category}</div>
                      </td>
                      <td><span className="chip">{r.partNumber || "--"}</span></td>
                      <td>{r.qtyPerUnit}</td>
                      <td style={{ color: "#ef4444", fontWeight: 600 }}>-{r.required}</td>
                      <td>{r.stock}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: isNeg ? "#ef4444" : isWarn ? "#f59e0b" : "#10b981" }}>
                          {r.projected}
                        </span>
                        {isNeg && <span className="status-chip critical" style={{ marginLeft: 6, fontSize: 10 }}>INSUFFICIENT</span>}
                        {isWarn && <span className="status-chip low" style={{ marginLeft: 6, fontSize: 10 }}>LOW</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {preview.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>
                ⓘ This is a preview. No inventory has been modified yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Production History ── */}
      <div className="card" style={{ marginTop: 20, padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>Production History</h3>
        <table className="mapping-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>PCB Model</th>
              <th>Batch No.</th>
              <th>Quantity</th>
              <th>Components Used</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No production records yet. Submit your first batch above.</td></tr>
            )}
            {history.slice(0, 20).map((h) => (
              <tr key={h.id}>
                <td style={{ fontWeight: 600 }}>{h.date}</td>
                <td>{h.time || "—"}</td>
                <td><strong>{h.pcbName || `PCB #${h.pcbId}`}</strong></td>
                <td><span className="chip">{h.batch || `BATCH-${h.id}`}</span></td>
                <td style={{ fontWeight: 700 }}>{h.quantity}</td>
                <td>{h.componentsUsed || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
