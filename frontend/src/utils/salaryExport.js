import { SALON_INFO } from "./salonInfo";

const money = (n) => Number(n || 0);
const rsText = (n) => `Rs. ${money(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const stamp = () => new Date().toISOString().slice(0, 10);

/**
 * report = { rangeLabel, branchName, generatedAt, months:[{key,label}], kpis:[{label,value}],
 *            register:[{name,role,branch,paid:{month:amount},total}], monthTotals:[{key,total}],
 *            ledger:[{month,date,name,role,branch,amount}] }
 */
export async function exportSalaryExcel(report) {
  const { default: writeExcelFile } = await import("write-excel-file/browser");
  const head = (v) => ({ value: v, fontWeight: "bold", textColor: "#ffffff", backgroundColor: "#53112f" });
  const num = (v, bold) => ({ value: money(v), type: Number, format: "#,##0.00", ...(bold ? { fontWeight: "bold" } : {}) });
  const grand = report.monthTotals.reduce((s, m) => s + m.total, 0);

  const sheets = [
    {
      sheet: "Summary",
      columns: [{ width: 24 }, { width: 34 }],
      data: [
        [{ value: `${SALON_INFO.name} - Salary Payments`, fontWeight: "bold", fontSize: 16 }],
        [{ value: "Months" }, { value: report.rangeLabel }],
        [{ value: "Branch" }, { value: report.branchName }],
        [{ value: "Generated" }, { value: report.generatedAt }],
        [],
        [head("Measure"), head("Value")],
        ...report.kpis.map((k) => [{ value: k.label }, { value: k.value }]),
      ],
    },
    {
      sheet: "Payroll register",
      columns: [{ width: 26 }, { width: 18 }, { width: 28 }, ...report.months.map(() => ({ width: 14 })), { width: 16 }],
      stickyColumnsCount: 1,
      data: [
        [head("Staff"), head("Role"), head("Branch"), ...report.months.map((m) => head(m.label)), head("Total (Rs.)")],
        ...report.register.map((r) => [
          { value: r.name }, { value: r.role }, { value: r.branch },
          ...report.months.map((m) => (r.paid[m.key] ? num(r.paid[m.key]) : { value: "-" })),
          num(r.total, true),
        ]),
        [{ value: "Total paid", fontWeight: "bold" }, null, null, ...report.monthTotals.map((m) => num(m.total, true)), num(grand, true)],
      ],
    },
    {
      sheet: "Payments",
      columns: [{ width: 12 }, { width: 14 }, { width: 26 }, { width: 18 }, { width: 28 }, { width: 16 }],
      data: [
        [head("Month"), head("Paid on"), head("Staff"), head("Role"), head("Branch"), head("Amount (Rs.)")],
        ...report.ledger.map((p) => [{ value: p.month }, { value: String(p.date || "") }, { value: p.name }, { value: p.role }, { value: p.branch }, num(p.amount)]),
      ],
    },
  ];
  await writeExcelFile(sheets).toFile(`salary-payments-${stamp()}.xlsx`);
}

export async function exportSalaryPdf(report) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 36;
  const PLUM = [83, 17, 47];
  const ROSE = [169, 26, 88];
  const grand = report.monthTotals.reduce((s, m) => s + m.total, 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...PLUM);
  doc.text(SALON_INFO.name, M, 46);
  doc.setFontSize(11);
  doc.setTextColor(...ROSE);
  doc.text("SALARY PAYMENTS", M, 63);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 70, 80);
  doc.text(`Months: ${report.rangeLabel}`, W - M, 40, { align: "right" });
  doc.text(`Branch: ${report.branchName}`, W - M, 53, { align: "right" });
  doc.text(`Generated: ${report.generatedAt}`, W - M, 66, { align: "right" });
  doc.setDrawColor(226, 215, 207);
  doc.line(M, 76, W - M, 76);

  const boxW = (W - M * 2 - 12 * 3) / 4;
  report.kpis.forEach((k, i) => {
    const x = M + i * (boxW + 12);
    doc.roundedRect(x, 88, boxW, 46, 4, 4);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ROSE);
    doc.text(k.label.toUpperCase(), x + 10, 103);
    doc.setFontSize(12);
    doc.setTextColor(...PLUM);
    doc.text(String(k.value), x + 10, 123, { maxWidth: boxW - 16 });
  });

  const style = { headStyles: { fillColor: PLUM, textColor: 255, fontSize: 8 }, bodyStyles: { fontSize: 8, textColor: [58, 10, 34] }, alternateRowStyles: { fillColor: [250, 246, 243] }, margin: { left: M, right: M }, theme: "grid", styles: { lineColor: [226, 215, 207], lineWidth: 0.5, cellPadding: 4 } };
  const colRight = (from, to) => Object.fromEntries(Array.from({ length: to - from + 1 }, (_, i) => [from + i, { halign: "right" }]));

  const regCols = report.months.length + 2; // staff + months + total
  autoTable(doc, {
    ...style,
    startY: 150,
    head: [["Staff", ...report.months.map((m) => m.label), "Total"]],
    body: [
      ...report.register.map((r) => [`${r.name}\n${r.role}`, ...report.months.map((m) => (r.paid[m.key] ? money(r.paid[m.key]).toLocaleString() : "-")), money(r.total).toLocaleString()]),
      ["Total paid", ...report.monthTotals.map((m) => (m.total ? money(m.total).toLocaleString() : "-")), money(grand).toLocaleString()],
    ],
    columnStyles: { 0: { cellWidth: 120 }, ...colRight(1, regCols - 1) },
    didParseCell: (d) => {
      if (d.section === "head" && d.column.index > 0) d.cell.styles.halign = "right";
      if (d.section === "body" && d.row.index === report.register.length) d.cell.styles.fontStyle = "bold";
    },
  });

  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...PLUM);
  doc.text("Payments", M, 46);
  autoTable(doc, {
    ...style,
    startY: 56,
    head: [["Month", "Paid on", "Staff", "Role", "Branch", "Amount"]],
    body: report.ledger.length ? report.ledger.map((p) => [p.month, String(p.date || ""), p.name, p.role, p.branch, rsText(p.amount)]) : [["", "", "No payments in this period", "", "", ""]],
    columnStyles: { 5: { halign: "right" } },
    didParseCell: (d) => { if (d.section === "head" && d.column.index === 5) d.cell.styles.halign = "right"; },
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(128, 103, 116);
    doc.text(`${SALON_INFO.name}  |  ${SALON_INFO.phone}`, M, H - 20);
    doc.text(`Page ${i} of ${pages}`, W - M, H - 20, { align: "right" });
  }
  doc.save(`salary-payments-${stamp()}.pdf`);
}
