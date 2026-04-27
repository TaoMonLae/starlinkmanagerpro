import PDFDocument from "pdfkit";
import { prisma } from "../config/prisma.js";
import { logActivity } from "../services/activityService.js";

function serializePayment(payment) {
  const receivable = payment.receivables?.[0];
  return {
    ...payment,
    amount: Number(payment.amount),
    currency: payment.account?.currency || "MYR",
    receivable: receivable
      ? {
          ...receivable,
          amount: Number(receivable.amount),
          amountReceived: Number(receivable.amountReceived)
        }
      : null
  };
}

function formatReceiptCurrency(value, currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "MMK" ? 0 : 2
  }).format(Number(value || 0));
}

function methodLabel(method) {
  return ({ CARD: "Card", BANK_TRANSFER: "Bank transfer", CASH: "Cash", PAYPAL: "PayPal", OTHER: "Other" })[method] || method;
}

function logoBufferFromDataUrl(dataUrl) {
  const match = /^data:image\/(?:png|jpeg);base64,(.+)$/i.exec(dataUrl || "");
  return match ? Buffer.from(match[1], "base64") : null;
}

export async function getPaymentReceipt(req, res) {
  const payment = await prisma.payment.findUnique({
    where: { id: req.params.id },
    include: { account: { include: { owner: true } } }
  });
  if (!payment || payment.account.userId !== req.user.id) return res.status(404).json({ message: "Payment not found" });

  const settings = await prisma.settings.findUnique({ where: { userId: req.user.id } });
  const appName = settings?.appName || "Starlink Manager Pro";
  const logoBuffer = logoBufferFromDataUrl(settings?.logoDataUrl);
  const currency = payment.account?.currency || "MYR";
  const amount = Number(payment.amount);
  const receiptNo = `SLR-${payment.id.slice(-6).toUpperCase()}`;
  const issuedAt = new Date();

  const doc = new PDFDocument({ margin: 42, size: "A5", compress: false, bufferPages: true });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="starlink-receipt-${receiptNo}.pdf"`);
  doc.pipe(res);

  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f4f1ea");
  doc.fillColor("#111111");

  doc.roundedRect(28, 28, doc.page.width - 56, 76, 8).fillAndStroke("#faf9f6", "#dedbd6");
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, 44, 42, { fit: [42, 42] });
    } catch {
      doc.fillColor("#ff5600").fontSize(9).text("STARLINK", 44, 44, { characterSpacing: 1.2 });
    }
  }
  const headerX = logoBuffer ? 96 : 44;
  doc.fillColor("#ff5600").fontSize(9).text(appName.toUpperCase(), headerX, 44, { characterSpacing: 1.2 });
  doc.fillColor("#111111").fontSize(20).text("Payment Receipt", headerX, 58);
  doc.fontSize(9).fillColor("#7b7b78").text(`Receipt No.  ${receiptNo}`, 44, 86);
  doc.text(`Issued  ${issuedAt.toLocaleString()}`, doc.page.width - 220, 86, { width: 180, align: "right" });

  let y = 130;
  const labelCol = 44;
  const valueCol = 170;

  const rows = [
    ["Account", payment.account.accountName],
    ["Gmail", payment.account.gmailEmail],
    ["Location", payment.account.location || "-"],
    ["Owner", payment.account.owner?.name || "Personal account"],
    ["Payment date", new Date(payment.date).toLocaleDateString()],
    ["Method", methodLabel(payment.method)],
    ["Reference", payment.reference || "-"]
  ];

  rows.forEach(([label, value]) => {
    doc.fillColor("#7b7b78").fontSize(8).text(label.toUpperCase(), labelCol, y, { characterSpacing: 0.6 });
    doc.fillColor("#111111").fontSize(11).text(String(value), valueCol, y - 2, { width: doc.page.width - valueCol - 44 });
    y += 22;
  });

  y += 8;
  doc.roundedRect(28, y, doc.page.width - 56, 60, 8).fillAndStroke("#111111", "#111111");
  doc.fillColor("#ffffff").fontSize(9).text("AMOUNT PAID", labelCol, y + 14, { characterSpacing: 1.2 });
  doc.fillColor("#ff5600").fontSize(22).text(formatReceiptCurrency(amount, currency), labelCol, y + 28);

  if (payment.notes) {
    y += 80;
    doc.fillColor("#7b7b78").fontSize(8).text("NOTES", labelCol, y, { characterSpacing: 0.6 });
    doc.fillColor("#111111").fontSize(10).text(String(payment.notes), labelCol, y + 12, {
      width: doc.page.width - 88
    });
  }

  doc.fillColor("#7b7b78").fontSize(8).text(
    "Thank you. Developed by Tao Mon Lae@2026",
    28,
    doc.page.height - 32,
    { width: doc.page.width - 56, align: "center" }
  );

  doc.end();
}

export async function listPayments(req, res) {
  const payments = await prisma.payment.findMany({
    where: { account: { userId: req.user.id } },
    include: { account: true, receivables: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { date: "desc" },
    take: Number(req.query.limit || 200)
  });
  res.json({ payments: payments.map(serializePayment) });
}

export async function createPayment(req, res) {
  const account = await prisma.account.findFirst({ where: { id: req.body.accountId, userId: req.user.id } });
  if (!account) return res.status(404).json({ message: "Account not found" });
  const payment = await prisma.payment.create({
    data: { ...req.body, userId: req.user.id },
    include: { account: true }
  });
  await logActivity({
    userId: req.user.id,
    type: "PAYMENT",
    message: `Payment recorded for ${payment.account.accountName}`,
    metadata: { amount: Number(payment.amount), accountId: payment.accountId }
  });
  res.status(201).json({ payment: serializePayment(payment) });
}

export async function updatePayment(req, res) {
  const existing = await prisma.payment.findFirst({
    where: { id: req.params.id, account: { userId: req.user.id } },
    include: { account: true }
  });
  if (!existing) return res.status(404).json({ message: "Payment not found" });

  const account = await prisma.account.findFirst({ where: { id: req.body.accountId, userId: req.user.id } });
  if (!account) return res.status(404).json({ message: "Account not found" });

  const payment = await prisma.payment.update({
    where: { id: existing.id },
    data: { ...req.body, userId: req.user.id },
    include: { account: true }
  });
  await logActivity({
    userId: req.user.id,
    type: "PAYMENT",
    message: `Updated payment for ${payment.account.accountName}`,
    metadata: { amount: Number(payment.amount), accountId: payment.accountId }
  });
  res.json({ payment: serializePayment(payment) });
}

export async function markPaid(req, res) {
  const account = await prisma.account.findFirst({ where: { id: req.params.accountId, userId: req.user.id } });
  if (!account) return res.status(404).json({ message: "Account not found" });

  const payment = await prisma.payment.create({
    data: {
      accountId: account.id,
      userId: req.user.id,
      amount: account.monthlyCost,
      method: "CARD",
      reference: `AUTO-${new Date().toISOString().slice(0, 10)}`,
      notes: "Marked paid from dashboard"
    },
    include: { account: true }
  });
  await logActivity({ userId: req.user.id, type: "PAYMENT", message: `Marked ${account.accountName} as paid` });
  res.status(201).json({ payment: serializePayment(payment) });
}
