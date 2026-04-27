import { parse } from "@fast-csv/parse";
import readXlsxFile from "read-excel-file/node";
import { prisma } from "../config/prisma.js";
import { logActivity } from "../services/activityService.js";

const statusMap = new Set(["ACTIVE", "SUSPENDED", "BACKUP", "CANCELLED"]);

function normalizeRow(row) {
  const status = String(row.status || "ACTIVE").toUpperCase();
  const rawBillingDate = row.billing_date || row.billingDate || null;
  const billingDate = rawBillingDate ? new Date(rawBillingDate) : null;
  const billingDateDay = billingDate && !Number.isNaN(billingDate.getTime()) ? billingDate.getUTCDate() : null;
  const billingDay = Math.min(Math.max(Number(billingDateDay || row.billing_day || row.billingDay || 1), 1), 28);
  return {
    accountName: String(row.account_name || row.accountName || "").trim(),
    gmailEmail: String(row.gmail_email || row.gmailEmail || "").trim().toLowerCase(),
    location: String(row.location || "Unknown").trim(),
    monthlyCost: Number(row.monthly_cost || row.monthlyCost || 0),
    billingDate,
    billingDay,
    status: statusMap.has(status) ? status : "ACTIVE",
    notes: row.notes ? String(row.notes) : null
  };
}

export async function importAccounts(req, res) {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const fileName = req.file.originalname.toLowerCase();
  if (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx")) {
    return res.status(400).json({ message: "Only CSV and XLSX imports are supported" });
  }

  const rawRows = fileName.endsWith(".csv")
    ? await parseCsv(req.file.buffer)
    : await parseWorkbook(req.file.buffer);
  const rows = rawRows.map(normalizeRow).filter((row) => row.accountName && row.gmailEmail);

  const results = [];
  for (const row of rows) {
    const account = await prisma.account.upsert({
      where: { userId_gmailEmail: { userId: req.user.id, gmailEmail: row.gmailEmail } },
      update: row,
      create: { ...row, userId: req.user.id }
    });
    results.push(account);
  }

  await logActivity({ userId: req.user.id, type: "IMPORT", message: `Imported ${results.length} accounts` });
  res.json({ imported: results.length });
}

async function parseWorkbook(buffer) {
  const rows = await readXlsxFile(buffer);
  const [headers = [], ...body] = rows;
  return body.map((row) =>
    row.reduce((record, value, index) => {
      record[String(headers[index] || "").trim()] = value;
      return record;
    }, {})
  );
}

function parseCsv(buffer) {
  return new Promise((resolve, reject) => {
    const rows = [];
    parseString(buffer.toString("utf8"), { headers: true, ignoreEmpty: true, trim: true })
      .on("error", reject)
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows));
  });
}

function parseString(input, options) {
  const stream = parse(options);
  queueMicrotask(() => stream.end(input));
  return stream;
}
