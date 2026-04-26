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

module.exports = pool;