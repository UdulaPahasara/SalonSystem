import { SALON_INFO } from "./salonInfo";
import { formatCell, isNumeric, totalsRow } from "./reportTables";

const stamp = () => new Date().toISOString().slice(0, 10);
const withTotals = (t) => (t.totals && t.rows.length ? [...t.rows, totalsRow(t)] : t.rows);

/**
 * report = { periodLabel, branchName, generatedAt, sections: [{ label, intro, tables: [{ title, note, columns, rows, totals }] }] }
 * (see buildSections in reportTables.js). Libraries are loaded on demand so the rest of the app stays fast.
 */
export async function exportReportExcel(report) {
  const { default: writeExcelFile } = await import("write-excel-file/browser");
  const head = (v) => ({ value: v, fontWeight: "bold", textColor: "#ffffff", backgroundColor: "#53112f" });
  const cell = (type, v, bold) => {
    const b = bold ? { fontWeight: "bold" } : {};
    switch (type) {
      case "int": return { value: Number(v || 0), type: Number, format: "#,##0", ...b };
      case "dec": return { value: Number(v || 0), type: Number, format: "#,##0.0", ...b };
      case "money": return { value: Number(v || 0), type: Number, format: "#,##0.00", ...b };
      case "pct": return { value: Number(v || 0) / 100, type: Number, format: "0.0%", ...b };
      case "change": return v == null ? { value: "-", ...b } : { value: Number(v) / 100, type: Number, format: "+0.0%;-0.0%", ...b };
      default: return { value: formatCell(type, v), ...b };
    }
  };

  const used = new Set();
  const sheets = report.sections.map((sec) => {
    const data = [[{ value: sec.label, fontWeight: "bold", fontSize: 14 }], [{ value: `${SALON_INFO.name} | ${report.periodLabel} | ${report.branchName}` }], []];
    let widest = 0;
    sec.tables.forEach((t) => {
      widest = Math.max(widest, t.columns.length);
      data.push([{ value: t.title, fontWeight: "bold", fontSize: 12 }]);
      if (t.note) data.push([{ value: t.note, textColor: "#806774" }]);
      data.push(t.columns.map((c) => head(c.label)));
      if (t.rows.length === 0) data.push([{ value: "Nothing to show for this period." }]);
      withTotals(t).forEach((r, i, all) => data.push(t.columns.map((c) => cell(c.type, r[c.key], t.totals && i === all.length - 1))));
      data.push([]);
    });
    let name = sec.label.replace(/[\\/?*[\]:]/g, " ").slice(0, 31);
    for (let n = 2; used.has(name); n++) name = `${name.slice(0, 28)} ${n}`;
    used.add(name);
    return { sheet: name, columns: Array.from({ length: Math.max(widest, 2) }, (_, i) => ({ width: i === 0 ? 34 : 18 })), data };
  });

  await writeExcelFile(sheets).toFile(`business-report-${stamp()}.xlsx`);
}

export async function exportReportPdf(report) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 36;
  const PLUM = [83, 17, 47];
  const ROSE = [169, 26, 88];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...PLUM);
  doc.text(SALON_INFO.name, M, 46);
  doc.setFontSize(12);
  doc.setTextColor(...ROSE);
  doc.text("BUSINESS REPORT", M, 64);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 70, 80);
  doc.text(`Period: ${report.periodLabel}`, W - M, 40, { align: "right" });
  doc.text(`Branch: ${report.branchName}`, W - M, 54, { align: "right" });
  doc.text(`Generated: ${report.generatedAt}`, W - M, 68, { align: "right" });
  doc.setDrawColor(226, 215, 207);
  doc.line(M, 78, W - M, 78);

  let y = 100;
  const room = (need) => {
    if (y + need > H - 50) { doc.addPage(); y = 46; }
  };
  const style = { headStyles: { fillColor: PLUM, textColor: 255, fontSize: 9 }, bodyStyles: { fontSize: 9, textColor: [58, 10, 34] }, alternateRowStyles: { fillColor: [250, 246, 243] }, margin: { left: M, right: M }, theme: "grid", styles: { lineColor: [226, 215, 207], lineWidth: 0.5 } };

  report.sections.forEach((sec, si) => {
    if (si > 0) { doc.addPage(); y = 46; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...PLUM);
    doc.text(sec.label, M, y);
    y += 16;
    if (sec.intro) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(128, 103, 116);
      doc.text(sec.intro, M, y, { maxWidth: W - M * 2 });
      y += 18;
    }
    sec.tables.forEach((t) => {
      room(70);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...ROSE);
      doc.text(t.title, M, y);
      y += 6;
      if (t.note) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(128, 103, 116);
        const lines = doc.splitTextToSize(t.note, W - M * 2);
        doc.text(lines, M, y + 8);
        y += lines.length * 10 + 2;
      }
      const rows = withTotals(t);
      const rightCols = t.columns.map((c, i) => (isNumeric(c.type) ? i : -1)).filter((i) => i >= 0);
      autoTable(doc, {
        ...style,
        startY: y + 4,
        head: [t.columns.map((c) => c.label)],
        body: rows.length ? rows.map((r) => t.columns.map((c) => formatCell(c.type, r[c.key]))) : [[{ content: "Nothing to show for this period.", colSpan: t.columns.length }]],
        columnStyles: Object.fromEntries(rightCols.map((i) => [i, { halign: "right" }])),
        didParseCell: (d) => {
          if (d.section === "head" && rightCols.includes(d.column.index)) d.cell.styles.halign = "right";
          if (t.totals && d.section === "body" && d.row.index === rows.length - 1) d.cell.styles.fontStyle = "bold";
        },
      });
      y = doc.lastAutoTable.finalY + 22;
    });
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(128, 103, 116);
    doc.text(`${SALON_INFO.name}  |  ${SALON_INFO.phone}`, M, H - 22);
    doc.text(`Page ${i} of ${pages}`, W - M, H - 22, { align: "right" });
  }
  doc.save(`business-report-${stamp()}.pdf`);
}
