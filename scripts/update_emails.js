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

    const updates = [
      {
        table: 'users',
        column: 'email',
      },
      {
        table: 'orders',
        column: 'buyerEmail',
      },
      {
        table: 'tickets',
        column: 'attendeeEmail',
      },
    ];

    for (const u of updates) {
      try {
        const res = await client.query(
          `UPDATE public."${u.table}" SET "${u.column}" = regexp_replace("${u.column}", '@eventra\\.app$', '@gmail.com') WHERE "${u.column}" LIKE '%@eventra.app' RETURNING "${u.column}";`
        );
        console.log(`Updated ${res.rowCount} rows in ${u.table}.${u.column}`);
      } catch (e) {
        console.warn(`Skipping ${u.table}.${u.column}:`, e.message || e);
      }
    }

    await client.end();
    console.log('Email update completed.');
  } catch (e) {
    console.error('Error:', e.message || e);
    process.exit(1);
  }
})();
