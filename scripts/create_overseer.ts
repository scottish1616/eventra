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

const prisma = new PrismaClient();

async function main() {
  const EMAIL = "kisakalevi15@gmail.com";
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });

  const passwordHash = await hash("scottishboy16", 12);

  if (existing) {
    const updated = await prisma.user.update({
      where: { email: EMAIL },
      data: {
        role: "OVERSEER",
        approvalStatus: "APPROVED",
        password: passwordHash
      },
    });
    console.log(`✅ Updated existing user to OVERSEER: ${updated.email}`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: "Levi Kisaka",
      email: EMAIL,
      phone: "0746484946",
      password: passwordHash,
      role: "OVERSEER",
      approvalStatus: "APPROVED",
    },
  });

  console.log(`✅ Overseer created successfully!`);
  console.log(`   Email:        ${user.email}`);
  console.log(`   Status:       APPROVED`);
}

main()
  .catch((e) => { console.error("❌ Failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
