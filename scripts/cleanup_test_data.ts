import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Load .env
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, "utf8");
    env.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) return;
      const key = m[1];
      let val = m[2] || "";
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (process.env[key] === undefined) process.env[key] = val;
    });
  }
} catch {}

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Starting cleanup of test data...\n");

  // ── 1. Delete all tickets, orders, payments, ticket types, events ────────
  const delTickets  = await prisma.ticket.deleteMany({});
  const delPayments = await prisma.payment.deleteMany({});
  const delItems    = await prisma.orderItem.deleteMany({});
  const delOrders   = await prisma.order.deleteMany({});
  const delTTypes   = await prisma.ticketType.deleteMany({});
  const delEvents   = await prisma.event.deleteMany({});
  console.log(`✅ Deleted ${delEvents.count} event(s)`);
  console.log(`   └─ ${delTTypes.count} ticket type(s)`);
  console.log(`   └─ ${delOrders.count} order(s)`);
  console.log(`   └─ ${delItems.count} order item(s)`);
  console.log(`   └─ ${delPayments.count} payment(s)`);
  console.log(`   └─ ${delTickets.count} ticket(s)`);

  // ── 2. Delete test organizer & customer accounts ─────────────────────────
  const testEmails = [
    "organizer@gmail.com",
    "organizer2@gmail.com",
    "user@gmail.com",
  ];

  const delUsers = await prisma.user.deleteMany({
    where: { email: { in: testEmails } },
  });
  console.log(`\n✅ Deleted ${delUsers.count} test user(s):`);
  testEmails.forEach((e) => console.log(`   └─ ${e}`));

  // ── 3. Try to delete reviews if the table exists ─────────────────────────
  try {
    // Use raw SQL in case the Prisma schema doesn't model this table
    const result: Array<{ count: bigint }> = await prisma.$queryRaw`
      SELECT COUNT(*)::bigint AS count FROM reviews
    `;
    const reviewCount = Number(result[0].count);
    await prisma.$executeRaw`DELETE FROM reviews`;
    console.log(`\n✅ Deleted ${reviewCount} review(s) from the reviews table`);
  } catch {
    console.log("\nℹ️  No 'reviews' table found — skipping.");
  }

  console.log("\n🎉 Cleanup complete. Database is now clean.");
}

main()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
