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

    console.log('Adding missing columns to users table...');
    
    await client.query('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "approvedBy" text');
    console.log('Added approvedBy column');
    
    await client.query('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "approvedAt" timestamp without time zone');
    console.log('Added approvedAt column');
    
    await client.query('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "rejectionReason" text');
    console.log('Added rejectionReason column');

    await client.end();
    console.log('All missing columns added successfully.');
  } catch (e) {
    console.error('Error:', e.message || e);
    process.exit(1);
  }
})();
