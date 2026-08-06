import { Client } from "pg";
import fs from "fs";
import path from "path";
import { hash } from "bcryptjs";

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

const EMAIL = "kisakalevi15@gmail.com";
const PASSWORD = "scottishboy16";

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("No database URL found in .env");
  }

  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    
    // 1. Try to add OVERSEER to UserRole enum (may fail if it already exists, so catch it)
    try {
      await client.query(`ALTER TYPE "UserRole" ADD VALUE 'OVERSEER'`);
      console.log("✅ Added OVERSEER to UserRole enum");
    } catch (e: any) {
      if (e.code === '42710') {
        console.log("ℹ️ OVERSEER already exists in UserRole enum");
      } else {
        console.error("⚠️ Failed to add OVERSEER to enum (might already exist):", e.message);
      }
    }

    // 2. Hash password
    const passwordHash = await hash(PASSWORD, 12);

    // 3. Insert or update user
    const query = `
      INSERT INTO users (
        id, name, email, phone, password, role,
        "subscriptionStatus", "approvalStatus", "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        'Levi Kisaka',
        $1,
        '0746484946',
        $2,
        'OVERSEER',
        'active',
        'APPROVED',
        now(),
        now()
      )
      ON CONFLICT (email) DO UPDATE SET
        role = 'OVERSEER',
        "subscriptionStatus" = 'active',
        password = $2;
    `;

    await client.query(query, [EMAIL, passwordHash]);
    console.log(`✅ Successfully created/updated OVERSEER account: ${EMAIL}`);
    console.log(`   Password: ${PASSWORD}`);
    console.log(`   You can now log in at /auth/login`);
    
  } catch (error) {
    console.error("❌ Database Error:", error);
  } finally {
    await client.end();
  }
}

main();
