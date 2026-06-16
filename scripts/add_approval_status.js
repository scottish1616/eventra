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
    console.log('Adding approvalStatus column to users table...');
    await client.query(
      'ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "approvalStatus" text DEFAULT \'' +
        'PENDING' +
        '\''
    );
    console.log('Column added (or already existed).');
    // Optionally set existing nulls to PENDING
    await client.query(
      'UPDATE public.users SET "approvalStatus" = \'' +
        'PENDING' +
        '\' WHERE "approvalStatus" IS NULL'
    );
    console.log('Existing rows updated.');
    await client.end();
  } catch (e) {
    console.error('Error:', e.message || e);
    process.exit(1);
  }
})();
