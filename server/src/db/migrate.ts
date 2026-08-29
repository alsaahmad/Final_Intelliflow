import { getDatabase } from './connection';
import fs from 'fs';
import path from 'path';

export async function runMigrations(): Promise<void> {
  const db = await getDatabase();
  const migrationsDir = path.join(__dirname, 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.warn(`Migrations directory not found at ${migrationsDir}`);
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    await db.exec(sql);
  }

  console.log(`✅ Applied ${files.length} database migration(s) successfully.`);
}

// If executed directly from CLI: tsx src/db/migrate.ts
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}
