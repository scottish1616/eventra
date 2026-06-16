const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};
  const env = {};
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    if (!line || line.trim().startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  });
  return env;
}

(async () => {
  try {
    const env = loadEnv();
    const client = new Client({ connectionString: env.DATABASE_URL });
    await client.connect();
    console.log('Creating enum type OrganizerApprovalStatus if not exists...');
    await client.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organizerapprovalstatus') THEN
        CREATE TYPE "OrganizerApprovalStatus" AS ENUM ('PENDING','APPROVED','REJECTED');
      END IF;
    END$$;`);

    console.log('Altering approvalStatus column to use the enum type...');
    await client.query(
      'ALTER TABLE public.users ALTER COLUMN "approvalStatus" TYPE "OrganizerApprovalStatus" USING ("approvalStatus"::text::"OrganizerApprovalStatus")'
    );

    console.log('Enum created and column altered.');
    await client.end();
  } catch (e) {
    console.error('Error:', e.message || e);
    process.exit(1);
  }
})();
