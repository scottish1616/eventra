const fs = require('fs');
const path = require('path');
(async () => {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const dotenv = fs.readFileSync(envPath, 'utf8');
    const m = dotenv.match(/DATABASE_URL=(.*)/);
    if (!m) {
      console.error('DATABASE_URL not found in .env');
      process.exit(1);
    }
    const dburl = m[1].trim().replace(/^"|"$/g, '');
    const { Client } = require('pg');
    const c = new Client({ connectionString: dburl });
    await c.connect();

    const statements = [
      "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS category text DEFAULT 'OTHER'",
      "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS priority text DEFAULT 'LOW'",
      "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS complainantEmail text",
      "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS replies jsonb DEFAULT '[]'::jsonb",
      "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS \"eventName\" text",
      "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS \"organizerName\" text",
    ];

    for (const s of statements) {
      console.log('Running:', s);
      await c.query(s);
    }

    // Optional: ensure existing NULLs get default values
    await c.query("UPDATE complaints SET category = 'OTHER' WHERE category IS NULL");
    await c.query("UPDATE complaints SET priority = 'LOW' WHERE priority IS NULL");
    await c.query("UPDATE complaints SET replies = '[]'::jsonb WHERE replies IS NULL");
    await c.query("UPDATE complaints SET \"eventName\" = '' WHERE \"eventName\" IS NULL");
    await c.query("UPDATE complaints SET \"organizerName\" = '' WHERE \"organizerName\" IS NULL");

    console.log('Done: columns ensured and defaults applied.');
    await c.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
