import React, { useEffect, useState } from "react";
import ExcelJS from "exceljs";
import { fetchPCBs, fetchComponents, createPCB as apiCreatePCB, deletePCB as apiDeletePCB, addBOMRow, removeBOMRow, updateBOMQty } from "../api";

export default function PCBMapping() {
  const [pcbs, setPcbs] = useState([]);
  const [components, setComponents] = useState([]);
  const [selectedPcb, setSelectedPcb] = useState("");
  const [componentId, setComponentId] = useState("");
  const [qtyPerPcb, setQtyPerPcb] = useState(1);

  /* ── New PCB modal ── */
  const [showNewPcb, setShowNewPcb] = useState(false);
  const [newPcbName, setNewPcbName] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [pcbList, compList] = await Promise.all([fetchPCBs(), fetchComponents()]);
      setPcbs(pcbList);
      setComponents(compList);
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  }

  /* ── Get the currently selected PCB object ── */
  const currentPcb = pcbs.find((p) => String(p.id) === String(selectedPcb));
  const bomRows = currentPcb?.bom || [];

  /* ── Create new PCB ── */
  async function handleCreatePcb() {
    if (!newPcbName.trim()) return alert("Enter a PCB name");
    try {
      const created = await apiCreatePCB(newPcbName.trim(), "");
      await loadData();
      setSelectedPcb(String(created.id));
      setNewPcbName("");
      setShowNewPcb(false);
    } catch (err) {
      alert(err.message || "Failed to create PCB");
    }
  }

  /* ── Add BOM row ── */
  async function addRow() {
    if (!selectedPcb) return alert("Select a PCB first");
    if (!componentId) return alert("Select a component");
    if (!qtyPerPcb || qtyPerPcb <= 0) return alert("Enter a valid quantity");

    const compIdNum = parseInt(componentId);
    if (bomRows.find((r) => r.compId === compIdNum)) {
      return alert("This component is already in the BOM. Edit quantity instead.");
    }

    try {
      await addBOMRow(selectedPcb, compIdNum, parseInt(qtyPerPcb));
      await loadData();
      setComponentId("");
      setQtyPerPcb(1);
    } catch (err) {
      alert(err.message || "Failed to add BOM row");
    }
  }

  /* ── Remove BOM row ── */
  async function removeRow(rowId) {
    try {
      await removeBOMRow(selectedPcb, rowId);
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to remove BOM row");
    }
  }

  /* ── Update quantity ── */
  async function handleUpdateQty(rowId, newQty) {
    const qty = parseInt(newQty);
    if (isNaN(qty) || qty <= 0) return;
    try {
      await updateBOMQty(selectedPcb, rowId, qty);
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to update quantity");
    }
  }

  /* ── Delete PCB ── */
  async function deletePcb() {
    if (!selectedPcb) return;
    if (!window.confirm(`Delete "${currentPcb?.name}"? This will remove it and its entire BOM.`)) return;
    try {
      await apiDeletePCB(selectedPcb);
      await loadData();
      setSelectedPcb("");
    } catch (err) {
      alert(err.message || "Failed to delete PCB");
    }
  }

  /* ── Export XLSX ── */
  async function exportXLSX() {
    if (!currentPcb || bomRows.length === 0) return alert("No BOM data to export");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`BOM - ${currentPcb.name}`);

    const headers = ["Component", "Part Number", "Category", "Qty Per Unit", "Available Stock", "Status"];
    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B5FFF" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center" };
    });

    bomRows.forEach((r) => {
      const comp = getCompById(r.compId);
      const status = comp.stock === 0 ? "STOCK OUT" : comp.stock < r.qty * 10 ? "LOW" : "SUFFICIENT";
      worksheet.addRow([comp.name, comp.partNumber, comp.category || "", r.qty, comp.stock, status]);
    });

    worksheet.columns.forEach((col, i) => {
      let maxLen = (headers[i] || "").length;
      bomRows.forEach((r) => {
        const comp = getCompById(r.compId);
        const vals = [comp.name, comp.partNumber, comp.category || "", String(r.qty), String(comp.stock), "SUFFICIENT"];
        if (vals[i] && vals[i].length > maxLen) maxLen = vals[i].length;
      });
      col.width = Math.min(maxLen + 4, 40);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `BOM_${currentPcb.name.replace(/\s/g, "_")}.xlsx`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ── Helper ── */
  function getCompById(id) {
    return components.find((c) => c.id === id) || { name: "Unknown", partNumber: "--", stock: 0, category: "" };
  }

  /* ── Stats ── */
  const totalQtyPerUnit = bomRows.reduce((s, r) => s + r.qty, 0);
  const uniqueComponents = bomRows.length;
  const insufficientCount = bomRows.filter((r) => {
    const comp = getCompById(r.compId);
    return comp.stock < r.qty * 10;
  }).length;

  return (
    <div className="container">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <div className="breadcrumbs">Inventory &gt; <strong>PCB MAPPING</strong></div>
          <h1>PCB-to-Component Mapping</h1>
          <p className="muted">Define and manage the Bill of Materials (BOM) for specific PCB production models.</p>
        </div>
        <div className="header-actions">
          <button className="btn" onClick={() => setShowNewPcb(true)}>+ New PCB</button>
          {selectedPcb && <button className="btn danger" onClick={deletePcb}>Delete PCB</button>}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="kpis">
        <div className="kpi card"><div className="kpi-title">TOTAL PCBs</div><div className="kpi-value">{pcbs.length}</div></div>
        <div className="kpi card"><div className="kpi-title">BOM ITEMS</div><div className="kpi-value">{uniqueComponents}</div></div>
        <div className="kpi card"><div className="kpi-title">PARTS PER UNIT</div><div className="kpi-value">{totalQtyPerUnit}</div></div>
        <div className="kpi card">
          <div className="kpi-title">STOCK ISSUES</div>
          <div className="kpi-value" style={{ color: insufficientCount > 0 ? "#ef4444" : "#10b981" }}>{insufficientCount}</div>
        </div>
      </div>

      {/* ── BOM Form ── */}
      <div className="card bom-form">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>Configure Bill of Materials</h3>
          {currentPcb && <div className="meta">PCB: <strong>{currentPcb.name}</strong> — {bomRows.length} components mapped</div>}
        </div>

        <div className="form-row inline">
          <div className="field">
            <label>Select PCB Name</label>
            <select value={selectedPcb} onChange={(e) => setSelectedPcb(e.target.value)}>
              <option value="">-- Select PCB --</option>
              {pcbs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Add Component</label>
            <select value={componentId} onChange={(e) => setComponentId(e.target.value)} disabled={!selectedPcb}>
              <option value="">-- Select Component --</option>
              {components.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.partNumber})</option>)}
            </select>
          </div>

          <div className="field small">
            <label>Qty per PCB</label>
            <input type="number" min="1" value={qtyPerPcb} onChange={(e) => setQtyPerPcb(e.target.value)} disabled={!selectedPcb} />
          </div>

          <div className="field actions-field">
            <label style={{ visibility: "hidden" }}>add</label>
            <button className="btn primary" onClick={addRow} disabled={!selectedPcb}>+ Add Row</button>
          </div>
        </div>
      </div>

      {/* ── Mapping Summary ── */}
      <div className="card mapping-summary">
        <div className="summary-header">
          <h3>Mapping Summary {currentPcb ? `— ${currentPcb.name}` : ""}</h3>
          <div className="summary-actions">
            <button className="btn" onClick={exportXLSX} disabled={bomRows.length === 0}>⬇ Export XLSX</button>
          </div>
        </div>

        <table className="mapping-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Part No.</th>
              <th>Category</th>
              <th>Qty Per Unit</th>
              <th>Available Stock</th>
              <th>Stock Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bomRows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                  {selectedPcb ? "No components mapped yet. Add components above." : "Select a PCB to view or edit its BOM."}
                </td>
              </tr>
            )}
            {bomRows.map((r) => {
              const comp = getCompById(r.compId);
              const stock = comp.stock || 0;
              const status = stock === 0 ? "STOCK OUT" : stock < r.qty * 10 ? "LOW" : "SUFFICIENT";
              const statusClass = status === "SUFFICIENT" ? "ok" : status === "LOW" ? "low" : "critical";
              return (
                <tr key={r.rowId || r.compId}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{comp.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{comp.category || "—"}</div>
                  </td>
                  <td><span className="chip">{comp.partNumber || "--"}</span></td>
                  <td>{comp.category || "—"}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={r.qty}
                      onChange={(e) => handleUpdateQty(r.rowId, e.target.value)}
                      style={{ width: 60, padding: "4px 8px", borderRadius: 6, border: "1px solid #e6eef6", textAlign: "center" }}
                    />
                  </td>
                  <td style={{ fontWeight: 600 }}>{stock} units</td>
                  <td><span className={`status-chip ${statusClass}`}>{status}</span></td>
                  <td><button className="btn small danger" onClick={() => removeRow(r.rowId)}>🗑 Remove</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {bomRows.length > 0 && (
          <div style={{ padding: "14px 16px", borderTop: "1px solid #eef2f7", fontSize: 13, color: "#64748b", display: "flex", justifyContent: "space-between" }}>
            <span><strong>{bomRows.length}</strong> components | <strong>{totalQtyPerUnit}</strong> total parts per unit</span>
            <span style={{ color: insufficientCount > 0 ? "#ef4444" : "#10b981", fontWeight: 600 }}>
              {insufficientCount > 0 ? `⚠ ${insufficientCount} stock issue(s)` : "✅ All components available"}
            </span>
          </div>
        )}
      </div>

      {/* ── New PCB Modal ── */}
      {showNewPcb && (
        <div className="inv-modal-overlay" onClick={() => setShowNewPcb(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>Create New PCB</h3>
              <button className="inv-modal-close" onClick={() => setShowNewPcb(false)}>×</button>
            </div>
            <div className="inv-modal-body">
              <label className="field-label">PCB Name</label>
              <input
                type="text"
                placeholder="e.g. Sensor Board v2.0"
                value={newPcbName}
                onChange={(e) => setNewPcbName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreatePcb()}
                autoFocus
              />
            </div>
            <div className="inv-modal-actions">
              <button className="btn" onClick={() => setShowNewPcb(false)}>Cancel</button>
              <button className="btn primary" onClick={handleCreatePcb}>Create PCB</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
