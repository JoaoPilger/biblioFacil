const { Pool } = require("pg");
require("dotenv").config();

function envTrim(key) {
  const v = process.env[key];
  return typeof v === "string" ? v.trim() : v;
}

const connectionString = envTrim("DATABASE_URL");

const pool = connectionString
  ? new Pool({ connectionString })
  : new Pool({
      user: envTrim("DB_USER"),
      host: envTrim("DB_HOST"),
      database: envTrim("DB_DATABASE") || envTrim("DB_NAME"),
      password: envTrim("DB_PASSWORD") || envTrim("DB_PASS"),
      port: Number(envTrim("DB_PORT") || 5432),
    });

pool.on("connect", () => {
  console.log("Conectado ao PostgreSQL com sucesso.");
});

// Auto-fix: Remove restrição antiga/invalida em 'emprestimos' se contiver os valores incorretos de 'livros'
pool.query(`
  DO $$ 
  BEGIN 
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      JOIN pg_class ON pg_class.oid = pg_constraint.conrelid 
      WHERE relname = 'emprestimos' 
        AND conname = 'emprestimos_status_check' 
        AND pg_get_constraintdef(pg_constraint.oid) LIKE '%disponivel%'
    ) THEN 
      ALTER TABLE emprestimos DROP CONSTRAINT emprestimos_status_check; 
    END IF; 
  END $$;
`).catch((err) => {
  console.error("Aviso na verificação de constraints:", err.message);
});

// Auto-fix: inclui 'indisponivel' no CHECK de livros.status (usado ao esgotar exemplares)
pool.query(`
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      WHERE t.relname = 'livros'
        AND c.conname = 'livros_status_check'
        AND pg_get_constraintdef(c.oid) NOT LIKE '%indisponivel%'
    ) THEN
      ALTER TABLE livros DROP CONSTRAINT livros_status_check;
      ALTER TABLE livros ADD CONSTRAINT livros_status_check
        CHECK (status IN ('disponivel', 'emprestado', 'reservado', 'indisponivel'));
    END IF;
  END $$;
`).catch((err) => {
  console.error("Aviso na correção de livros.status:", err.message);
});

module.exports = pool;
