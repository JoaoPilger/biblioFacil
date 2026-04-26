const fs = require("fs");
const path = require("path");
const db = require("../src/config/db");

async function runMigrations() {
  const migrationsDir = path.join(__dirname, "..", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (!files.length) {
    console.log("Nenhuma migration encontrada.");
    await db.end();
    return;
  }

  for (const file of files) {
    const migrationPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(migrationPath, "utf8");
    console.log(`Executando migration: ${file}`);
    await db.query(sql);
  }

  console.log("Migrations executadas com sucesso.");
  await db.end();
}

runMigrations().catch(async (error) => {
  console.error("Erro ao executar migrations:", error);
  await db.end();
  process.exit(1);
});
