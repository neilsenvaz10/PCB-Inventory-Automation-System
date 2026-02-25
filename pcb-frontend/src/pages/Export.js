import React, { useEffect, useState, useMemo } from "react";
import ExcelJS from "exceljs";
import { fetchComponents, fetchPCBs, fetchProductionHistory } from "../api";

/* ── Column definitions per data source (stable reference) ── */
const columnDefs = {
  components: {
    groups: {
      "Component Info": ["Name", "Part Number", "Category"],
      "Stock Data": ["Current Stock", "Monthly Required", "Status"],
    },
    getRow: (c) => ({
      Name: c.name,
      "Part Number": c.partNumber,
      Category: c.category || "—",
      "Current Stock": c.stock,
      "Monthly Required": c.monthlyRequired,
      Status: c.stock > c.monthlyRequired ? "Healthy" : c.stock > c.monthlyRequired / 2 ? "Low" : "Critical",
    }),
  },
  production: {
    groups: {
      "Production Info": ["Date", "Time", "PCB Model", "Batch", "Quantity"],
    },
    getRow: (h) => ({
      Date: h.date,
      Time: h.time || "—",
      "PCB Model": h.pcbName || `PCB #${h.pcbId}`,
      Batch: h.batch || `BATCH-${h.id}`,
      Quantity: h.quantity,
    }),
  },
  pcbs: {
    groups: {
      "PCB Info": ["PCB Name", "BOM Components", "Total Parts/Unit"],
    },
    getRow: (p) => ({
      "PCB Name": p.name,
      "BOM Components": (p.bom || []).length,
      "Total Parts/Unit": (p.bom || []).reduce((s, b) => s + b.qty, 0),
    }),
  },
};

export default function ExportPage() {
  const [components, setComponents] = useState([]);
  const [production, setProduction] = useState([]);
  const [pcbs, setPcbs] = useState([]);

  /* ── Settings ── */
  const [dataSource, setDataSource] = useState("components");
  const [fileName, setFileName] = useState("inventory_export");
  const [selected, setSelected] = useState(new Set());
  const [exportHistory, setExportHistory] = useState([]);

  useEffect(() => {
    fetchComponents().then(setComponents).catch(console.error);
    fetchProductionHistory().then(setProduction).catch(console.error);
    fetchPCBs().then(setPcbs).catch(console.error);
    setExportHistory(JSON.parse(localStorage.getItem("exportHistory") || "[]"));
  }, []);

  const currentDef = columnDefs[dataSource];
  const allCols = Object.values(currentDef.groups).flat();

  /* ── Auto-select all columns when data source changes ── */
  useEffect(() => {
    setSelected(new Set(allCols));
    // Update suggested filename
    const names = { components: "inventory_export", production: "production_report", pcbs: "pcb_mapping_export" };
    setFileName(names[dataSource] || "export");
  }, [dataSource]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Source data ── */
  const sourceData = dataSource === "components" ? components : dataSource === "production" ? production : pcbs;

  /* ── Toggle column ── */
  function toggle(col) {
    const s = new Set(selected);
    if (s.has(col)) s.delete(col); else s.add(col);
    setSelected(s);
  }

  /* ── Build export data ── */
  const exportRows = useMemo(() => {
    const cols = allCols.filter((c) => selected.has(c));
    return sourceData.map((item) => {
      const rowData = currentDef.getRow(item);
      const row = {};
      cols.forEach((c) => { row[c] = rowData[c]; });
      return row;
    });
  }, [sourceData, selected, allCols, currentDef]);

  const selectedCols = allCols.filter((c) => selected.has(c));

  /* ── Download as XLSX ── */
  async function doDownload() {
    if (selected.size === 0) return alert("Select at least one column.");
    if (sourceData.length === 0) return alert("No data to export.");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Export");

    // Add header row
    worksheet.addRow(selectedCols);

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B5FFF" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center" };
    });

    // Add data rows
    exportRows.forEach((row) => {
      worksheet.addRow(selectedCols.map((c) => row[c] ?? ""));
    });

    // Auto-fit column widths
    worksheet.columns.forEach((col, i) => {
      const header = selectedCols[i] || "";
      let maxLen = header.length;
      exportRows.forEach((row) => {
        const val = String(row[header] ?? "");
        if (val.length > maxLen) maxLen = val.length;
      });
      col.width = Math.min(maxLen + 4, 40);
    });

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${fileName}.xlsx`;
    a.click();
    URL.revokeObjectURL(a.href);

    // Save to export history
    const entry = {
      id: Date.now(),
      name: `${fileName}.xlsx`,
      source: dataSource,
      rows: sourceData.length,
      cols: selected.size,
      format: "xlsx",
      date: new Date().toLocaleString(),
    };
    const updatedHistory = [entry, ...exportHistory].slice(0, 20);
    setExportHistory(updatedHistory);
    localStorage.setItem("exportHistory", JSON.stringify(updatedHistory));
  }

  /* ── Estimated size ── */
  const estSize = useMemo(() => {
    const bytes = selectedCols.length * sourceData.length * 15;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }, [selectedCols, sourceData]);

  const sourceLabels = { components: "📦 Components", production: "🏭 Production", pcbs: "🧩 PCBs" };

  return (
    <div className="container">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <div className="breadcrumbs">Data Management &gt; <strong>EXPORT</strong></div>
          <h1>Configure Export</h1>
          <p className="muted">Select data source and columns, then download as Excel (.xlsx).</p>
        </div>
        <div className="header-actions">
          <button className="btn primary" onClick={doDownload}>⬇ Download XLSX</button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="kpis">
        <div className="kpi card"><div className="kpi-title">DATA SOURCE</div><div className="kpi-value" style={{ fontSize: 16 }}>{sourceLabels[dataSource]}</div></div>
        <div className="kpi card"><div className="kpi-title">TOTAL ROWS</div><div className="kpi-value">{sourceData.length}</div></div>
        <div className="kpi card"><div className="kpi-title">SELECTED COLS</div><div className="kpi-value">{selected.size} / {allCols.length}</div></div>
        <div className="kpi card"><div className="kpi-title">EST. FILE SIZE</div><div className="kpi-value">{estSize}</div></div>
      </div>

      <div className="export-layout">
        {/* ── LEFT: Settings ── */}
        <div className="export-left card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>Export Settings</h3>

          <label className="field-label">Data Source</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {Object.entries(sourceLabels).map(([key, label]) => (
              <button key={key} className={`btn ${dataSource === key ? "primary" : ""}`} onClick={() => setDataSource(key)} style={{ flex: 1 }}>{label}</button>
            ))}
          </div>

          <label className="field-label">File Name</label>
          <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #e6eef6", marginBottom: 12, boxSizing: "border-box" }} />

          <label className="field-label">Format</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button className="btn primary" style={{ flex: 1, cursor: "default" }}>📊 XLSX (Excel)</button>
          </div>

          {/* Column selection */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label className="field-label" style={{ margin: 0 }}>Column Selection</label>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn small" onClick={() => setSelected(new Set(allCols))}>All</button>
              <button className="btn small" onClick={() => setSelected(new Set())}>Clear</button>
            </div>
          </div>

          {Object.entries(currentDef.groups).map(([group, cols]) => (
            <div key={group} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>{group}</div>
              {cols.map((c) => (
                <label key={c} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={selected.has(c)} onChange={() => toggle(c)} />
                  {c}
                </label>
              ))}
            </div>
          ))}

          <button className="btn primary" onClick={doDownload} style={{ width: "100%", marginTop: 8 }}>⬇ Download XLSX</button>
        </div>

        {/* ── RIGHT: Preview ── */}
        <div className="export-right">
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>Export Preview</h3>
            </div>

            {selectedCols.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>Select columns to see preview</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="mapping-table">
                  <thead>
                    <tr>{selectedCols.map((c) => <th key={c}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {sourceData.length === 0 && (
                      <tr><td colSpan={selectedCols.length} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No data available</td></tr>
                    )}
                    {exportRows.slice(0, 8).map((row, i) => (
                      <tr key={i}>
                        {selectedCols.map((c) => {
                          const val = row[c];
                          const isStatus = c === "Status";
                          return (
                            <td key={c}>
                              {isStatus ? (
                                <span className={`status-chip ${val === "Healthy" ? "ok" : val === "Low" ? "low" : "critical"}`}>{val}</span>
                              ) : c === "Part Number" || c === "Batch" ? (
                                <span className="chip">{val}</span>
                              ) : (
                                val
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sourceData.length > 8 && (
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8, textAlign: "center" }}>
                    Showing 8 of {sourceData.length} rows in preview
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, fontSize: 13, color: "#64748b", borderTop: "1px solid #eef2f7", paddingTop: 12 }}>
              <span>{selectedCols.length} columns • {sourceData.length} rows</span>
              <span>Estimated: {estSize}</span>
            </div>
          </div>

          {/* ── Export History ── */}
          {exportHistory.length > 0 && (
            <div className="card" style={{ padding: 20, marginTop: 16 }}>
              <h4 style={{ marginTop: 0 }}>Recent Exports</h4>
              <table className="mapping-table">
                <thead>
                  <tr><th>File</th><th>Source</th><th>Rows</th><th>Format</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {exportHistory.slice(0, 5).map((h) => (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 600 }}>{h.name}</td>
                      <td>{sourceLabels[h.source] || h.source}</td>
                      <td>{h.rows}</td>
                      <td><span className="chip">{(h.format || "xlsx").toUpperCase()}</span></td>
                      <td className="muted">{h.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
