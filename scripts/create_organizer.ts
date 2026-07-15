import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import fs from "fs";
import path from "path";

// Load .env
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .forEach((line) => {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!m) return;
        let val = m[2] || "";
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (process.env[m[1]] === undefined) process.env[m[1]] = val;
      });
  }
} catch {}

// ── Edit these ────────────────────────────────────────────────────────────────
const NAME             = "Levi Kisaka";
const EMAIL            = "kisakalevi@gmail.com";
const PHONE            = "+254746484946";
const PASSWORD         = "yourpassword";        // change this!
const ORGANIZATION     = "Eventra Events";
// ─────────────────────────────────────────────────────────────────────────────

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });

  if (existing) {
    // Update to ORGANIZER + APPROVED if user already exists
    const updated = await prisma.user.update({
      where: { email: EMAIL },
      data: {
        role: "ORGANIZER",
        approvalStatus: "APPROVED",
        organizationName: ORGANIZATION,
        phone: PHONE,
      },
    });
    console.log(`✅ Updated existing user to ORGANIZER (APPROVED): ${updated.email}`);
    return;
  }

  const passwordHash = await hash(PASSWORD, 12);

  const user = await prisma.user.create({
    data: {
      name: NAME,
      email: EMAIL,
      phone: PHONE,
      password: passwordHash,
      role: "ORGANIZER",
      organizationName: ORGANIZATION,
      approvalStatus: "APPROVED",   // pre-approved so you can log in immediately
    },
  });

  console.log(`✅ Organizer created successfully!`);
  console.log(`   Name:         ${user.name}`);
  console.log(`   Email:        ${user.email}`);
  console.log(`   Organization: ${user.organizationName}`);
  console.log(`   Status:       APPROVED`);
  console.log(`\n   Log in at /auth/login with the password you set above.`);
}

main()
  .catch((e) => { console.error("❌ Failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
