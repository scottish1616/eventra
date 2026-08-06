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
    const res = await c.query("select column_name,data_type from information_schema.columns where table_name='complaints'");
    console.log(JSON.stringify(res.rows, null, 2));
    await c.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
