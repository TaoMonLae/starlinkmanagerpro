import { Parser } from "@json2csv/plainjs";
import PDFDocument from "pdfkit";
import { getMonthlyReportData, getReportsData } from "../services/reportService.js";
import { prisma } from "../config/prisma.js";
import { getExchangeRates } from "../services/exchangeRateService.js";

export async function reports(req, res) {
  res.json(await getReportsData(req.user.id));
}

export async function monthlyReport(req, res) {
  const months = Math.min(Math.max(Number(req.query.months || 12), 1), 36);
  res.json({ months: await getMonthlyReportData(months, req.user.id) });
}

async function resolveCurrencyContext(userId) {
  const [user, rateData] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { settings: true } }),
    getExchangeRates("USD")
  ]);
  const currency = user?.settings?.currency || "MYR";
  const appName = user?.settings?.appName || "Starlink Manager Pro";
  const logoDataUrl = user?.settings?.logoDataUrl || null;
  return { currency, rateData, appName, logoDataUrl };
}

export async function exportPaymentsCsv(req, res) {
  const [payments, { currency, rateData }] = await Promise.all([
    prisma.payment.findMany({ where: { account: { userId: req.user.id } }, include: { account: true }, orderBy: { date: "desc" } }),
    resolveCurrencyContext(req.user.id)
  ]);
  const rows = payments.map((p) => {
    const source = p.account?.currency || "MYR";
    const original = Number(p.amount);
    const converted = convertCurrency(original, currency, rateData.rates, source);
    return {
      date: p.date.toISOString().slice(0, 10),
      account: sanitizeCsvCell(p.account.accountName),
      gmail: sanitizeCsvCell(p.account.gmailEmail),
      original_amount: Number(original.toFixed(source === "MMK" ? 0 : 2)),
      original_currency: source,
      [`amount_${currency}`]: Number(converted.toFixed(currency === "MMK" ? 0 : 2)),
      currency,
      method: p.method,
      reference: sanitizeCsvCell(p.reference || ""),
      notes: sanitizeCsvCell(p.notes || "")
    };
  });
  const parser = new Parser();
  const csv = parser.parse(rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="starlink-payments-report-${currency}.csv"`);
  res.send(csv);
}

function sanitizeCsvCell(value) {
  const str = String(value ?? "");
  return /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
}

export async function exportReceivablesPdf(req, res) {
  const [report, { currency, rateData, appName, logoDataUrl }] = await Promise.all([
    getReportsData(req.user.id),
    resolveCurrencyContext(req.user.id)
  ]);
  const formatMoney = (value, source = "USD") => formatCurrency(convertCurrency(value, currency, rateData.rates, source), currency);
  const doc = new PDFDocument({ margin: 42, size: "A4", compress: false, bufferPages: true });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="starlink-receivables-report-${currency}.pdf"`);
  res.setHeader("X-Report-Currency", currency);
  res.setHeader("X-Exchange-Rate-Provider", rateData.provider);
  doc.pipe(res);

  drawPdfBackground(doc);
  drawPdfHeader(doc, currency, rateData, appName, logoDataUrl);
  drawSummaryCards(doc, [
    ["Total Receivable", formatMoney(report.receivableSummary.total)],
    ["Received", formatMoney(report.receivableSummary.received)],
    ["Outstanding", formatMoney(report.receivableSummary.outstanding)]
  ]);

  const headers = ["Debtor", "Account", "Amount", "Received", "Outstanding", "Status"];
  const widths = [105, 105, 75, 75, 90, 60];
  let y = 250;
  drawTableHeader(doc, headers, widths, y);
  y += 26;

  report.receivables.forEach((item) => {
    if (y > 730) {
      doc.addPage();
      drawPdfBackground(doc);
      y = 56;
      drawTableHeader(doc, headers, widths, y);
      y += 26;
    }
    const source = item.account?.currency || "MYR";
    const row = [
      item.debtorName,
      item.account?.accountName || "-",
      formatMoney(item.amount, source),
      formatMoney(item.amountReceived, source),
      formatMoney(item.outstanding, source),
      item.status
    ];
    drawTableRow(doc, row, widths, y);
    y += 30;
  });

  drawPdfFooter(doc);
  doc.end();
}

function drawPdfFooter(doc) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(range.start + i);
    doc.fillColor("#7b7b78").fontSize(8).text(
      "Developed by Tao Mon Lae@2026",
      36,
      doc.page.height - 28,
      { width: doc.page.width - 72, align: "center" }
    );
  }
}

function convertCurrency(value, targetCurrency, rates, sourceCurrency = "USD") {
  const amount = Number(value || 0);
  if (sourceCurrency === targetCurrency) return amount;
  const sourceRate = sourceCurrency === "USD" ? 1 : Number(rates?.[sourceCurrency]);
  const targetRate = targetCurrency === "USD" ? 1 : Number(rates?.[targetCurrency]);
  if (!Number.isFinite(sourceRate) || sourceRate <= 0 || !Number.isFinite(targetRate) || targetRate <= 0) {
    throw new Error(`Missing exchange rate to convert ${sourceCurrency} to ${targetCurrency}`);
  }
  return (amount / sourceRate) * targetRate;
}

function formatCurrency(value, currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "MMK" ? 0 : 2
  }).format(Number(value || 0));
}

function drawPdfBackground(doc) {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f4f1ea");
  doc.fillColor("#111111");
}

function logoBufferFromDataUrl(dataUrl) {
  const match = /^data:image\/(?:png|jpeg);base64,(.+)$/i.exec(dataUrl || "");
  return match ? Buffer.from(match[1], "base64") : null;
}

function drawPdfHeader(doc, currency, rateData, appName, logoDataUrl) {
  const logoBuffer = logoBufferFromDataUrl(logoDataUrl);
  doc.roundedRect(36, 32, 523, 118, 8).fillAndStroke("#faf9f6", "#dedbd6");
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, 56, 56, { fit: [42, 42] });
    } catch {
      doc.fillColor("#ff5600").fontSize(9).text("STARLINK", 56, 52, { characterSpacing: 1.2 });
    }
  }
  const headerX = logoBuffer ? 112 : 56;
  doc.fillColor("#ff5600").fontSize(9).text(String(appName || "Starlink Manager Pro").toUpperCase(), headerX, 52, { characterSpacing: 1.2 });
  doc.fillColor("#111111").fontSize(26).text("Receivables Report", headerX, 70);
  doc.fontSize(10).fillColor("#7b7b78").text("Starlink Manager Pro", headerX, 103);
  doc.text(`Generated ${new Date().toLocaleString()}`, headerX, 120);
  doc.fillColor("#111111").fontSize(10).text(`Currency: ${currency}`, 400, 56, { width: 130, align: "right" });
  doc.fillColor("#7b7b78").fontSize(8).text(`${rateData.provider}${rateData.fallback ? " (fallback)" : ""}`, 332, 74, { width: 198, align: "right" });
  doc.text(`Rates updated: ${rateData.updatedAt}`, 332, 88, { width: 198, align: "right" });
}

function drawSummaryCards(doc, cards) {
  const startX = 36;
  const y = 166;
  const gap = 10;
  const width = 167.6;
  cards.forEach(([label, value], index) => {
    const x = startX + index * (width + gap);
    doc.roundedRect(x, y, width, 58, 8).fillAndStroke("#ffffff", "#dedbd6");
    doc.fillColor("#7b7b78").fontSize(8).text(label.toUpperCase(), x + 12, y + 13, { characterSpacing: 0.8 });
    doc.fillColor(index === 2 ? "#ff5600" : "#111111").fontSize(16).text(value, x + 12, y + 30, { width: width - 24 });
  });
}

function drawTableHeader(doc, headers, widths, y) {
  doc.roundedRect(36, y - 8, 523, 26, 6).fillAndStroke("#111111", "#111111");
  headers.forEach((header, index) => {
    doc.fillColor("#ffffff").fontSize(8).text(header.toUpperCase(), 48 + widths.slice(0, index).reduce((a, b) => a + b, 0), y, { width: widths[index], characterSpacing: 0.6 });
  });
}

function drawTableRow(doc, row, widths, y) {
  doc.roundedRect(36, y - 8, 523, 28, 6).fillAndStroke("#faf9f6", "#dedbd6");
  row.forEach((value, index) => {
    doc.fillColor(index === 4 ? "#ff5600" : "#111111").fontSize(8.5).text(String(value), 48 + widths.slice(0, index).reduce((a, b) => a + b, 0), y, { width: widths[index] });
  });
}
