import { jsPDF } from "jspdf";
import type { HardwareProduct, ValidationResult } from "@/types/hardware";

// ─── Palette ──────────────────────────────────────────────────────────────────

type RGB = [number, number, number];

const C = {
  bg:      [10, 10, 15]      as RGB,
  panel:   [18, 24, 38]      as RGB,
  border:  [30, 40, 60]      as RGB,
  cyan:    [6, 182, 212]     as RGB,
  white:   [240, 244, 248]   as RGB,
  gray:    [100, 116, 139]   as RGB,
  dimGray: [55, 65, 81]      as RGB,
  emerald: [16, 185, 129]    as RGB,
  red:     [239, 68, 68]     as RGB,
  amber:   [245, 158, 11]    as RGB,
};

const CAT_COLORS: Record<string, RGB> = {
  CPU:         [6, 182, 212],
  Motherboard: [139, 92, 246],
  RAM:         [16, 185, 129],
  GPU:         [236, 72, 153],
  PSU:         [245, 158, 11],
  Storage:     [59, 130, 246],
  Case:        [100, 116, 139],
  Cooler:      [20, 184, 166],
};

function cc(category: string): RGB {
  return CAT_COLORS[category] ?? C.gray;
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

const PAGE_H    = 297;
const MARGIN    = 18;
const CONTENT_W = 174;

function fillPage(doc: jsPDF): void {
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, 210, PAGE_H, "F");
  doc.setFillColor(...C.cyan);
  doc.rect(0, 0, 210, 1.5, "F");
}

function hRule(doc: jsPDF, y: number, color: RGB = C.border, width = 0.3): void {
  doc.setDrawColor(...color);
  doc.setLineWidth(width);
  doc.line(MARGIN, y, 192, y);
}

function panel(doc: jsPDF, y: number, h: number): void {
  doc.setFillColor(...C.panel);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(MARGIN, y, CONTENT_W, h, 2, 2, "FD");
}

/** Agrega nueva página si el bloque no cabe; retorna la nueva posición Y. */
function guard(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_H - 22) {
    doc.addPage();
    fillPage(doc);
    return MARGIN + 4;
  }
  return y;
}

// ─── Specs builder ────────────────────────────────────────────────────────────

function buildSpecs(p: HardwareProduct): string {
  const m    = p.metadata;
  const tags: string[] = [];

  if (m.socket_type)    tags.push(`Socket ${m.socket_type}`);
  if (m.ram_generation) tags.push(m.ram_generation);
  if (m.form_factor)    tags.push(m.form_factor);
  if (m.tdp_watts)      tags.push(`${m.tdp_watts}W TDP`);
  if (m.wattage_watts)  tags.push(`${m.wattage_watts}W PSU`);
  if (m.vram_gb)        tags.push(`${m.vram_gb}GB VRAM`);
  if (m.capacity_gb)    tags.push(`${m.capacity_gb}GB RAM`);
  if (m.speed_mhz)      tags.push(`${m.speed_mhz} MHz`);
  if (m.storage_capacity_gb) {
    const tb = m.storage_capacity_gb >= 1000;
    tags.push(tb ? `${m.storage_capacity_gb / 1000}TB` : `${m.storage_capacity_gb}GB`);
  }
  if (m.interface_type) tags.push(m.interface_type.replace(/_/g, " "));
  if (m.cooler_type)    tags.push(m.cooler_type.replace(/_/g, " "));
  if (m.tdp_rating)     tags.push(`${m.tdp_rating}W rated`);

  return tags.slice(0, 6).join("  ·  ");
}

// ─── Export params ────────────────────────────────────────────────────────────

export interface PDFExportParams {
  products:       HardwareProduct[];
  totalPrice:     number;
  totalTdp:       number;
  validation:     ValidationResult | null;
  buildUrl:       string;
  clientName?:    string;
  currency:       string;
  totalLocal:     number;
  currencySymbol: string;
  showWithTax:    boolean;
  taxRate:        number;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function exportBuildToPDF({
  products, totalPrice, totalTdp, validation, buildUrl,
  clientName, currency, totalLocal, currencySymbol, showWithTax, taxRate,
}: PDFExportParams): Promise<void> {
  const QRCode    = (await import("qrcode")).default;
  const qrDataUrl = await QRCode.toDataURL(buildUrl, {
    color:  { dark: "#06b6d4", light: "#0a0a0f" },
    width:  300,
    margin: 2,
  });

  const doc  = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W    = 210;
  const now  = new Date();

  fillPage(doc);
  let y = 22;

  // ── Logo ──────────────────────────────────────────────────────────────────
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.cyan);
  doc.text("TECH", MARGIN, y);
  const techW = doc.getTextWidth("TECH");

  doc.setTextColor(...C.dimGray);
  doc.text(" // ", MARGIN + techW, y);
  const sepW = doc.getTextWidth(" // ");

  doc.setTextColor(...C.white);
  doc.text("TITAN", MARGIN + techW + sepW, y);

  // Badge tipo de documento
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.cyan);
  doc.setDrawColor(...C.cyan);
  doc.setLineWidth(0.3);
  doc.roundedRect(140, y - 6, 52, 9, 1.5, 1.5, "D");
  doc.text("PC BUILDER  //  COTIZACIÓN", 142, y - 0.5);

  y += 7;

  // Fecha
  const fecha = now.toLocaleDateString("es-ES", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.gray);
  doc.text(fecha, MARGIN, y);

  y += 3;
  hRule(doc, y, C.cyan, 0.4);
  y += 7;

  // ── Cliente + validez ────────────────────────────────────────────────────
  const validezDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const validezStr  = validezDate.toLocaleDateString("es-ES", {
    year: "numeric", month: "long", day: "numeric",
  });

  if (clientName) {
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.gray);
    doc.text("COTIZACIÓN PARA:", MARGIN, y);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    doc.text(clientName, MARGIN, y + 5.5);
    y += 11;
  }

  // Fila de metadatos de la cotización
  panel(doc, y, 10);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");

  doc.setTextColor(...C.gray);
  doc.text("Válida hasta:", MARGIN + 4, y + 4);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  doc.text(validezStr, MARGIN + 26, y + 4);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.gray);
  const taxLabel = showWithTax ? `Con IGV/IVA (${taxRate}%)` : "Sin impuestos";
  doc.text(taxLabel, W - MARGIN - 4, y + 4, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(showWithTax ? C.emerald[0] : C.dimGray[0], showWithTax ? C.emerald[1] : C.dimGray[1], showWithTax ? C.emerald[2] : C.dimGray[2]);

  y += 14;

  // ── Tabla de componentes ─────────────────────────────────────────────────
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.cyan);
  doc.text("COMPONENTES SELECCIONADOS", MARGIN, y);

  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.dimGray);
  doc.text(`${products.length} item${products.length !== 1 ? "s" : ""}`, W - MARGIN, y, { align: "right" });

  y += 4;

  for (const p of products) {
    const specs    = buildSpecs(p);
    const hasDesc  = Boolean(p.description?.trim());
    const rowH     = hasDesc ? 15 : 12;

    y = guard(doc, y, rowH + 2);
    panel(doc, y, rowH);

    // Barra lateral de color de categoría
    const color = cc(p.category);
    doc.setFillColor(...color);
    doc.roundedRect(MARGIN, y, 2, rowH, 1, 1, "F");

    // Etiqueta categoría
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...color);
    doc.text(p.category.toUpperCase(), MARGIN + 4, y + 4.5);
    const catLabelW = doc.getTextWidth(p.category.toUpperCase());

    // Nombre del producto
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    const nameStr = doc.splitTextToSize(p.name, 105)[0] as string;
    doc.text(nameStr, MARGIN + 4 + catLabelW + 2, y + 4.5);

    // Specs técnicos
    if (specs) {
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.gray);
      doc.text(specs, MARGIN + 4, y + 9);
    }

    // Descripción corta (si existe y hay espacio)
    if (hasDesc) {
      const descLine = (doc.splitTextToSize(p.description!, 120)[0] as string) ?? "";
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...C.dimGray);
      doc.text(descLine, MARGIN + 4, y + 13);
    }

    // Precio — derecha
    if (p.price_usd !== undefined) {
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...color);
      doc.text(
        `$${p.price_usd.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        W - MARGIN - 2, y + 5,
        { align: "right" }
      );
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.dimGray);
      doc.text("USD", W - MARGIN - 2, y + 9.5, { align: "right" });
    }

    y += rowH + 2;
  }

  y += 4;
  hRule(doc, y, C.dimGray, 0.2);
  y += 6;

  // ── Totales ──────────────────────────────────────────────────────────────
  y = guard(doc, y, 24);
  panel(doc, y, 24);

  // Etiqueta TOTAL
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.gray);
  doc.text("TOTAL", MARGIN + 4, y + 6);

  if (currency !== "USD") {
    // Moneda local — grande y prominente
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.cyan);
    const localStr = `${currencySymbol} ${totalLocal.toLocaleString("es-LA", {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    })}`;
    doc.text(localStr, MARGIN + 4, y + 14);

    // Equivalente USD debajo
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.gray);
    doc.text(
      `= $${totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD`,
      MARGIN + 4, y + 21
    );
  } else {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.cyan);
    doc.text(
      `$${totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD`,
      MARGIN + 4, y + 14
    );
  }

  // PSU recomendada (esquina derecha del panel)
  if (totalTdp > 0) {
    const recPsu = `${Math.ceil((totalTdp * 1.35) / 50) * 50}W`;
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.amber);
    doc.text(`Consumo: ${totalTdp}W`, W - MARGIN - 4, y + 8, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(`PSU ≥ ${recPsu} 80+Gold`, W - MARGIN - 4, y + 14, { align: "right" });
  }

  y += 28;

  // ── Compatibilidad ───────────────────────────────────────────────────────
  if (validation) {
    const isOk       = validation.compatible;
    const statusCol  = isOk ? C.emerald : C.red;
    const statusText = isOk ? "✓  BUILD COMPATIBLE" : "✗  INCOMPATIBILIDAD DETECTADA";

    const errH   = validation.errors.length * 9;
    const warnH  = validation.warnings.length > 0
      ? validation.warnings.length * 8 + 8
      : 0;
    const blockH = 14 + errH + warnH;

    y = guard(doc, y, blockH + 4);
    panel(doc, y, blockH);
    doc.setFillColor(...statusCol);
    doc.roundedRect(MARGIN, y, 2, blockH, 1, 1, "F");

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...statusCol);
    doc.text(statusText, MARGIN + 5, y + 8);

    let ey = y + 14;
    for (const err of validation.errors) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.red);
      const lines = doc.splitTextToSize(`▸  ${err}`, 162) as string[];
      doc.text(lines, MARGIN + 5, ey);
      ey += lines.length * 5.5;
    }

    if (validation.warnings.length > 0) {
      ey += 3;
      hRule(doc, ey, C.dimGray, 0.15);
      ey += 5;
      for (const warn of validation.warnings) {
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.amber);
        const lines = doc.splitTextToSize(`⚠  ${warn}`, 162) as string[];
        doc.text(lines, MARGIN + 5, ey);
        ey += lines.length * 5;
      }
    }

    y += blockH + 8;
  }

  // ── QR + URL de compartir ────────────────────────────────────────────────
  y = guard(doc, y, 52);
  hRule(doc, y, C.cyan, 0.4);
  y += 8;

  const qrSize = 36;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.cyan);
  doc.text("COMPARTIR ESTE BUILD", MARGIN, y + 4);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.gray);
  doc.text("Escanea el código QR o copia la URL para", MARGIN, y + 10);
  doc.text("recuperar esta configuración exacta en el browser.", MARGIN, y + 15.5);

  const maxUrlChars = 58;
  const displayUrl  = buildUrl.length > maxUrlChars
    ? buildUrl.slice(0, maxUrlChars - 3) + "..."
    : buildUrl;

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.cyan);
  doc.text(displayUrl, MARGIN, y + 22);

  doc.addImage(qrDataUrl, "PNG", W - MARGIN - qrSize, y - 2, qrSize, qrSize);

  // ── Footer en todas las páginas ──────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);
    doc.setFillColor(...C.cyan);
    doc.rect(0, PAGE_H - 1.5, W, 1.5, "F");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.dimGray);
    doc.text("Generado por Tech-Titan PC Builder", MARGIN, PAGE_H - 4);
    doc.text(
      `tech-titan.dev  ·  ${now.toLocaleDateString("es-ES")}  ·  pág. ${pg}/${totalPages}`,
      W - MARGIN, PAGE_H - 4,
      { align: "right" }
    );
  }

  const ts = now.toISOString().slice(0, 10);
  doc.save(`tech-titan-cotizacion-${ts}.pdf`);
}
