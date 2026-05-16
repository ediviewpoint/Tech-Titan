import { jsPDF } from "jspdf";
import type { HardwareProduct, ValidationResult } from "@/types/hardware";

// ─── Color palette ────────────────────────────────────────────────────────────

type RGB = [number, number, number];

const C = {
  bg:      [10, 10, 15]       as RGB,
  panel:   [18, 24, 38]       as RGB,
  border:  [30, 40, 60]       as RGB,
  cyan:    [6, 182, 212]      as RGB,
  white:   [240, 244, 248]    as RGB,
  gray:    [100, 116, 139]    as RGB,
  dimGray: [55, 65, 81]       as RGB,
  emerald: [16, 185, 129]     as RGB,
  red:     [239, 68, 68]      as RGB,
  amber:   [245, 158, 11]     as RGB,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fillPage(doc: jsPDF): void {
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, 210, 297, "F");
}

function hRule(doc: jsPDF, y: number, color: RGB = C.border, width = 0.3): void {
  doc.setDrawColor(...color);
  doc.setLineWidth(width);
  doc.line(18, y, 192, y);
}

function panel(doc: jsPDF, y: number, h: number): void {
  doc.setFillColor(...C.panel);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(18, y, 174, h, 2, 2, "FD");
}

// ─── Main export function ─────────────────────────────────────────────────────

export interface PDFExportParams {
  products:    HardwareProduct[];
  totalPrice:  number;
  totalTdp:    number;
  validation:  ValidationResult | null;
  buildUrl:    string;
}

export async function exportBuildToPDF({
  products, totalPrice, totalTdp, validation, buildUrl,
}: PDFExportParams): Promise<void> {
  // QR code — importación dinámica para no penalizar el bundle inicial
  const QRCode    = (await import("qrcode")).default;
  const qrDataUrl = await QRCode.toDataURL(buildUrl, {
    color:  { dark: "#06b6d4", light: "#0a0a0f" },
    width:  280,
    margin: 2,
  });

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W   = 210;

  fillPage(doc);

  let y = 22;

  // ── Barra superior neon ────────────────────────────────────────────────────
  doc.setFillColor(...C.cyan);
  doc.rect(0, 0, W, 1.5, "F");

  // ── Logo ──────────────────────────────────────────────────────────────────
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.cyan);
  doc.text("TECH", 18, y);

  const techW = doc.getTextWidth("TECH");
  doc.setTextColor(...C.dimGray);
  doc.text(" // ", 18 + techW, y);

  const sepW = doc.getTextWidth(" // ");
  doc.setTextColor(...C.white);
  doc.text("TITAN", 18 + techW + sepW, y);

  // Badge derecho
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.cyan);
  doc.setDrawColor(...C.cyan);
  doc.setLineWidth(0.3);
  doc.roundedRect(150, y - 6, 42, 9, 1.5, 1.5, "D");
  doc.text("PC BUILDER // BUILD REPORT", 151, y - 0.5);

  y += 7;

  // Fecha y subtítulo
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.gray);
  const fecha = new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  doc.text(fecha, 18, y);

  y += 3;
  hRule(doc, y, C.cyan, 0.4);
  y += 8;

  // ── Sección: Componentes ───────────────────────────────────────────────────
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.cyan);
  doc.text("COMPONENTES SELECCIONADOS", 18, y);
  y += 4;

  for (const p of products) {
    const rowH = 11;
    panel(doc, y, rowH);

    // Línea lateral de categoría (color por tipo)
    const catColor: RGB =
      p.category === "CPU"         ? [6, 182, 212]   :
      p.category === "Motherboard" ? [139, 92, 246]  :
      p.category === "RAM"         ? [16, 185, 129]  :
      p.category === "GPU"         ? [236, 72, 153]  :
      p.category === "PSU"         ? [245, 158, 11]  :
                                     [100, 116, 139];
    doc.setFillColor(...catColor);
    doc.roundedRect(18, y, 2, rowH, 1, 1, "F");

    // Categoría
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...catColor);
    doc.text(p.category.toUpperCase(), 23, y + 4.5);

    const catW = doc.getTextWidth(p.category.toUpperCase());

    // Nombre
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    const name = doc.splitTextToSize(p.name, 100);
    doc.text(name[0], 23 + catW + 2, y + 4.5);

    // Specs secundarias
    const specs: string[] = [];
    if (p.metadata.socket_type)    specs.push(`Socket ${p.metadata.socket_type}`);
    if (p.metadata.tdp_watts)      specs.push(`${p.metadata.tdp_watts}W TDP`);
    if (p.metadata.ram_generation) specs.push(p.metadata.ram_generation);
    if (p.metadata.form_factor)    specs.push(p.metadata.form_factor);
    if (p.metadata.wattage_watts)  specs.push(`${p.metadata.wattage_watts}W`);

    if (specs.length > 0) {
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.gray);
      doc.text(specs.join("  ·  "), 23, y + 8.5);
    }

    // Precio (derecha)
    if (p.price !== undefined) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.cyan);
      doc.text(`$${p.price.toLocaleString()}`, W - 20, y + 5, { align: "right" });
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.gray);
      doc.text("USD", W - 20, y + 9, { align: "right" });
    }

    y += rowH + 2;
  }

  y += 4;
  hRule(doc, y, C.dimGray, 0.2);
  y += 6;

  // ── Totales ────────────────────────────────────────────────────────────────
  if (totalPrice > 0 || totalTdp > 0) {
    panel(doc, y, 16);

    if (totalPrice > 0) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.gray);
      doc.text("TOTAL", 22, y + 6);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.cyan);
      doc.text(`$${totalPrice.toLocaleString()} USD`, 40, y + 7);
    }

    if (totalTdp > 0) {
      const recPsu = `${Math.ceil((totalTdp * 1.35) / 50) * 50}W`;
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.amber);
      doc.text(`TDP estimado: ${totalTdp}W  ·  PSU recomendada: ≥ ${recPsu} 80+ Gold`, 22, y + 13);
    }

    y += 20;
  }

  // ── Estado de compatibilidad ───────────────────────────────────────────────
  if (validation) {
    const isOk       = validation.compatible;
    const statusCol  = isOk ? C.emerald : C.red;
    const statusText = isOk ? "✓  BUILD COMPATIBLE" : "✗  INCOMPATIBILIDAD DETECTADA";

    const errH = isOk ? 0 : validation.errors.length * 9;
    const warnH = validation.warnings.length * 8;
    const blockH = 14 + errH + (warnH > 0 ? warnH + 4 : 0);

    panel(doc, y, blockH);
    doc.setFillColor(...statusCol);
    doc.roundedRect(18, y, 2, blockH, 1, 1, "F");

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...statusCol);
    doc.text(statusText, 23, y + 8);

    let ey = y + 14;

    for (const err of validation.errors) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.red);
      const lines = doc.splitTextToSize(`▸  ${err}`, 162);
      doc.text(lines, 23, ey);
      ey += lines.length * 5.5;
    }

    if (validation.warnings.length > 0) {
      ey += 2;
      hRule(doc, ey, C.dimGray, 0.15);
      ey += 4;
      for (const warn of validation.warnings) {
        doc.setFontSize(6.5);
        doc.setTextColor(...C.amber);
        const lines = doc.splitTextToSize(`⚠  ${warn}`, 162);
        doc.text(lines, 23, ey);
        ey += lines.length * 5;
      }
    }

    y += blockH + 8;
  }

  // ── QR + URL de compartir ─────────────────────────────────────────────────
  hRule(doc, y, C.cyan, 0.4);
  y += 8;

  const qrSize = 36;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.cyan);
  doc.text("COMPARTIR ESTE BUILD", 18, y + 4);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.gray);
  doc.text("Escanea el código QR o copia la URL para", 18, y + 10);
  doc.text("recuperar esta configuración exacta en el browser.", 18, y + 15.5);

  // URL recortada
  const maxUrlChars = 58;
  const displayUrl  = buildUrl.length > maxUrlChars
    ? buildUrl.slice(0, maxUrlChars - 3) + "..."
    : buildUrl;

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.cyan);
  doc.text(displayUrl, 18, y + 22);

  // QR
  doc.addImage(qrDataUrl, "PNG", W - 18 - qrSize, y - 2, qrSize, qrSize);

  y += qrSize + 4;

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setFillColor(...C.cyan);
  doc.rect(0, 295.5, W, 1.5, "F");

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.dimGray);
  doc.text("Generado por Tech-Titan PC Builder", 18, 292);
  doc.text(
    `tech-titan.dev  ·  ${new Date().toLocaleDateString("es-ES")}`,
    W - 18, 292, { align: "right" }
  );

  doc.save(`tech-titan-build-${Date.now()}.pdf`);
}
