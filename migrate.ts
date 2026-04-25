import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';

async function main() {
  const pool = mysql.createPool(process.env.DATABASE_URL!);
  const db = drizzle(pool);
  console.log('[migrate] Rodando migrações...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('[migrate] Concluído.');
  await pool.end();
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
