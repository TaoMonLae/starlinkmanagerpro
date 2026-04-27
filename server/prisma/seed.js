import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const accountNames = [
  "mnwstarlink_ad",
  "WangSpaw",
  "NMSPad",
  "DayHtong",
  "MSRF",
  "starlinkmini",
  "mnwstarlink-1",
  "mnwstarlink92",
  "mnwstarlink93",
  "mnwstarlink94",
  "mnwstarlink95"
];

const locations = [
  "Mae Sot Office",
  "Wang Pha Base",
  "NMS Pad",
  "Day Htong Site",
  "MSRF Hub",
  "Mobile Mini Kit",
  "Northern Field 1",
  "Remote House 92",
  "Remote House 93",
  "Remote House 94",
  "Remote House 95"
];

async function main() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set before seeding. Refusing to create a default admin.");
  }
  if (process.env.ADMIN_PASSWORD.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }
  const email = process.env.ADMIN_EMAIL.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      name: "Private Owner",
      email,
      passwordHash,
      settings: { create: { theme: "system", currency: "MYR", inactivityMs: 1800000, appName: "Starlink Manager Pro" } }
    }
  });

  await prisma.settings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, theme: "system", currency: "MYR", inactivityMs: 1800000, appName: "Starlink Manager Pro" }
  });

  for (let index = 0; index < accountNames.length; index += 1) {
    const name = accountNames[index];
    const billingDay = [2, 4, 6, 9, 11, 13, 15, 18, 21, 24, 27][index];
    const billingDate = new Date(new Date().getFullYear(), new Date().getMonth(), billingDay, 12, 0, 0);
    const gmailEmail = `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}@gmail.com`;
    const account = await prisma.account.upsert({
      where: { userId_gmailEmail: { userId: user.id, gmailEmail } },
      update: {},
      create: {
        userId: user.id,
        accountName: name,
        gmailEmail,
        location: locations[index],
        monthlyCost: [220, 235, 199, 250, 210, 165, 225, 230, 245, 218, 240][index],
        currency: "MYR",
        billingDate,
        billingDay,
        status: index === 5 ? "BACKUP" : "ACTIVE",
        notes: "Seeded starter account. Replace with exact Starlink metadata when ready."
      }
    });

    const monthsBack = [4, 3, 2, 1, 0];
    for (const offset of monthsBack) {
      if (index % 5 === 0 && offset === 0) continue;
      const paidAt = new Date();
      paidAt.setMonth(paidAt.getMonth() - offset);
      paidAt.setDate(Math.min(Number(account.billingDay), 28));
      await prisma.payment.upsert({
        where: { id: `${account.id}-${paidAt.toISOString().slice(0, 7)}` },
        update: {},
        create: {
          id: `${account.id}-${paidAt.toISOString().slice(0, 7)}`,
          accountId: account.id,
          userId: user.id,
          date: paidAt,
          amount: account.monthlyCost,
          method: "CARD",
          reference: `SL-${name}-${paidAt.toISOString().slice(0, 7)}`,
          notes: "Seeded payment"
        }
      });
    }
  }

  const managedOwners = [
    { id: "seed-owner-field-team", name: "Field Team Alpha", contact: "Ops channel", email: "field.alpha@example.com", phone: "+66 81 100 2001" },
    { id: "seed-owner-clinic", name: "Clinic Relay", contact: "Clinic admin", email: "clinic.relay@example.com", phone: "+66 81 100 2002" },
    { id: "seed-owner-education", name: "Education Hub", contact: "School coordinator", email: "education.hub@example.com", phone: "+66 81 100 2003" }
  ];
  for (const owner of managedOwners) {
    await prisma.managedOwner.upsert({
      where: { id: owner.id },
      update: {},
      create: { ...owner, userId: user.id, notes: "Seeded managed owner for accounts operated on behalf of others." }
    });
  }

  const accountsForOwners = await prisma.account.findMany({ where: { userId: user.id }, orderBy: { accountName: "asc" }, take: 6 });
  for (let index = 0; index < accountsForOwners.length; index += 1) {
    await prisma.account.update({
      where: { id: accountsForOwners[index].id },
      data: { ownerId: managedOwners[index % managedOwners.length].id }
    });
  }

  const seededAccounts = await prisma.account.findMany({ where: { userId: user.id }, orderBy: { accountName: "asc" }, take: 5 });
  const debtors = ["Saw Htoo", "Naw Paw", "Field Team Alpha", "Clinic Relay", "Education Hub"];
  for (let index = 0; index < seededAccounts.length; index += 1) {
    const account = seededAccounts[index];
    const amount = Number(account.monthlyCost);
    const received = index % 3 === 0 ? 0 : Math.round(amount * 0.35);
    await prisma.receivable.upsert({
      where: { id: `seed-receivable-${index + 1}` },
      update: {},
      create: {
        id: `seed-receivable-${index + 1}`,
        userId: user.id,
        accountId: account.id,
        debtorName: debtors[index],
        debtorContact: `+66 8${index + 1} 000 10${index}`,
        description: `Starlink monthly service paid on behalf of ${debtors[index]}`,
        amount,
        amountReceived: received,
        dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), Math.min(Number(account.billingDay) + 7, 28), 12, 0, 0),
        status: received > 0 ? "PARTIAL" : "OPEN",
        notes: "Seeded receivable for owner-paid shared Starlink cost."
      }
    });
  }

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      type: "SETTINGS",
      message: "Seed data installed for Starlink Manager Pro"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed complete");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
