import jsPDF from "jspdf";

interface ExportPDFOptions {
  title: string;
  subtitle?: string;
  content: string | Record<string, unknown>;
  filename?: string;
}

export function exportToPDF({ title, subtitle, content, filename }: ExportPDFOptions) {
  const doc = new jsPDF();
  const margin = 20;
  let y = margin;

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, y);
  y += 10;

  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, margin, y);
    y += 8;
  }

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, 190, y);
  y += 10;

  // Body
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  const text = typeof content === "string"
    ? content
    : JSON.stringify(content, null, 2);

  const lines = doc.splitTextToSize(text, 170);

  for (const line of lines) {
    if (y > 280) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 6;
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  const date = new Date().toLocaleDateString("fr-FR");
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`ScalingFlow — ${date} — Page ${i}/${pageCount}`, margin, 290);
  }

  const safeName = filename || `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
  doc.save(safeName);
}
