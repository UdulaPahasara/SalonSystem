import { SALON_INFO } from "./salonInfo";

const money = (n) => Number(n || 0);
const rsText = (n) => `Rs. ${money(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const stamp = () => new Date().toISOString().slice(0, 10);

/**
 * report = { periodLabel, branchName, generatedAt, kpis:[{label,value}], revenueTitle,
 *            revenueRows:[{label,count,revenue}], services:[{name,qty,revenue,share}],
 *            products:[...], payments:[{method,count,revenue,share}], branches:[{name,count,revenue,share}] }
 * Libraries are loaded on demand so the rest of the app stays fast.
 */
export async function exportReportExcel(report) {
  const { default: writeExcelFile } = await import("write-excel-file/browser");
  const head = (v) => ({ value: v, fontWeight: "bold", textColor: "#ffffff", backgroundColor: "#53112f" });
  const num = (v) => ({ value: money(v), type: Number, format: "#,##0.00" });
  const int = (v) => ({ value: Number(v || 0), type: Number, format: "#,##0" });
  const pct = (v) => ({ value: Number(v || 0) / 100, type: Number, format: "0.0%" });

  const ranked = (rows, label) => [
    [head("Rank"), head(label), head("Units"), head("Revenue (Rs.)"), head("Share of sales")],
    ...rows.map((r, i) => [int(i + 1), { value: r.name }, int(r.qty), num(r.revenue), pct(r.share)]),
  ];

  const sheets = [
    {
      sheet: "Summary",
      columns: [{ width: 28 }, { width: 34 }],
      data: [
        [{ value: `${SALON_INFO.name} - Sales Report`, fontWeight: "bold", fontSize: 16 }],
        [{ value: "Period" }, { value: report.periodLabel }],
        [{ value: "Branch" }, { value: report.branchName }],
        [{ value: "Generated" }, { value: report.generatedAt }],
        [],
        [head("Measure"), head("Value")],
        ...report.kpis.map((k) => [{ value: k.label }, { value: k.value }]),
      ],
    },
    {
      sheet: "Revenue",
      columns: [{ width: 18 }, { width: 16 }, { width: 18 }],
      data: [
        [head(report.revenueTitle), head("Transactions"), head("Revenue (Rs.)")],
        ...report.revenueRows.map((r) => [{ value: r.label }, int(r.count), num(r.revenue)]),
        [{ value: "Total", fontWeight: "bold" }, { ...int(report.revenueRows.reduce((s, r) => s + r.count, 0)), fontWeight: "bold" }, { ...num(report.revenueRows.reduce((s, r) => s + r.revenue, 0)), fontWeight: "bold" }],
      ],
    },
    { sheet: "Top Services", columns: [{ width: 8 }, { width: 38 }, { width: 10 }, { width: 18 }, { width: 16 }], data: ranked(report.services, "Service") },
    { sheet: "Top Products", columns: [{ width: 8 }, { width: 38 }, { width: 10 }, { width: 18 }, { width: 16 }], data: ranked(report.products, "Product") },
    {
      sheet: "Breakdown",
      columns: [{ width: 36 }, { width: 16 }, { width: 18 }, { width: 16 }],
      data: [
        [head("Payment method"), head("Transactions"), head("Revenue (Rs.)"), head("Share")],
        ...report.payments.map((p) => [{ value: p.method }, int(p.count), num(p.revenue), pct(p.share)]),
        [],
        [head("Branch"), head("Transactions"), head("Revenue (Rs.)"), head("Share")],
        ...report.branches.map((b) => [{ value: b.name }, int(b.count), num(b.revenue), pct(b.share)]),
      ],
    },
  ];

  await writeExcelFile(sheets).toFile(`sales-report-${stamp()}.xlsx`);
}

export async function exportReportPdf(report) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;
  const PLUM = [83, 17, 47];
  const ROSE = [169, 26, 88];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...PLUM);
  doc.text(SALON_INFO.name, M, 50);
  doc.setFontSize(12);
  doc.setTextColor(...ROSE);
  doc.text("SALES REPORT", M, 68);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 70, 80);
  doc.text(`Period: ${report.periodLabel}`, W - M, 44, { align: "right" });
  doc.text(`Branch: ${report.branchName}`, W - M, 58, { align: "right" });
  doc.text(`Generated: ${report.generatedAt}`, W - M, 72, { align: "right" });
  doc.setDrawColor(226, 215, 207);
  doc.line(M, 82, W - M, 82);

  // KPI strip
  const boxW = (W - M * 2 - 12 * 3) / 4;
  report.kpis.slice(0, 4).forEach((k, i) => {
    const x = M + i * (boxW + 12);
    doc.setDrawColor(226, 215, 207);
    doc.roundedRect(x, 96, boxW, 52, 4, 4);
    doc.setFontSize(8);
    doc.setTextColor(...ROSE);
    doc.setFont("helvetica", "bold");
    doc.text(k.label.toUpperCase(), x + 10, 112);
    doc.setFontSize(12);
    doc.setTextColor(...PLUM);
    doc.text(String(k.value), x + 10, 134, { maxWidth: boxW - 16 });
  });

  const style = { headStyles: { fillColor: PLUM, textColor: 255, fontSize: 9 }, bodyStyles: { fontSize: 9, textColor: [58, 10, 34] }, alternateRowStyles: { fillColor: [250, 246, 243] }, margin: { left: M, right: M }, theme: "grid", styles: { lineColor: [226, 215, 207], lineWidth: 0.5 } };
  let y = 168;
  const section = (title) => {
    if (y > 740) { doc.addPage(); y = 50; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...PLUM);
    doc.text(title, M, y);
    y += 8;
  };
  const table = (head, body, extra = {}) => {
    // right-align the header of every column whose body cells are right-aligned
    const rightCols = Object.entries(extra.columnStyles || {}).filter(([, v]) => v.halign === "right").map(([k]) => Number(k));
    const userParse = extra.didParseCell;
    autoTable(doc, {
      ...style,
      startY: y,
      head: [head],
      body,
      ...extra,
      didParseCell: (d) => {
        if (d.section === "head" && rightCols.includes(d.column.index)) d.cell.styles.halign = "right";
        if (userParse) userParse(d);
      },
    });
    y = doc.lastAutoTable.finalY + 24;
  };

  section(report.revenueTitle === "Date" ? "Revenue by day" : "Revenue by month");
  table(
    [report.revenueTitle, "Transactions", "Revenue"],
    [...report.revenueRows.map((r) => [r.label, r.count, rsText(r.revenue)]),
     ["Total", report.revenueRows.reduce((s, r) => s + r.count, 0), rsText(report.revenueRows.reduce((s, r) => s + r.revenue, 0))]],
    { columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } }, didParseCell: (d) => { if (d.row.index === report.revenueRows.length && d.section === "body") d.cell.styles.fontStyle = "bold"; } }
  );
  section("Top services");
  table(["#", "Service", "Units", "Revenue", "Share"], report.services.length ? report.services.map((r, i) => [i + 1, r.name, r.qty, rsText(r.revenue), `${r.share.toFixed(1)}%`]) : [["", "No services sold in this period", "", "", ""]], { columnStyles: { 0: { cellWidth: 26 }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } } });
  section("Top products");
  table(["#", "Product", "Units", "Revenue", "Share"], report.products.length ? report.products.map((r, i) => [i + 1, r.name, r.qty, rsText(r.revenue), `${r.share.toFixed(1)}%`]) : [["", "No products sold in this period", "", "", ""]], { columnStyles: { 0: { cellWidth: 26 }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } } });
  section("Payment methods");
  table(["Method", "Transactions", "Revenue", "Share"], report.payments.map((p) => [p.method, p.count, rsText(p.revenue), `${p.share.toFixed(1)}%`]), { columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } } });
  if (report.branches.length > 1) {
    section("Branches");
    table(["Branch", "Transactions", "Revenue", "Share"], report.branches.map((b) => [b.name, b.count, rsText(b.revenue), `${b.share.toFixed(1)}%`]), { columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } } });
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(128, 103, 116);
    doc.text(`${SALON_INFO.name}  |  ${SALON_INFO.phone}`, M, 820);
    doc.text(`Page ${i} of ${pages}`, W - M, 820, { align: "right" });
  }
  doc.save(`sales-report-${stamp()}.pdf`);
}
