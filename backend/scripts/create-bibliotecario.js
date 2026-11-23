const path = require("path");
const fs = require("fs");
const readline = require("readline");

// Garante o carregamento do .env a partir da pasta backend/
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
} else {
  console.warn("\n[AVISO] Arquivo backend/.env não encontrado!");
  console.warn("Certifique-se de configurar o arquivo backend/.env com as credenciais do PostgreSQL (DB_USER, DB_PASSWORD, etc).\n");
}

const bcrypt = require("bcrypt");
const db = require("../src/config/db");

function askQuestion(query, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (hidden && process.stdin.isTTY && typeof process.stdin.setRawMode === "function") {
      process.stdout.write(query);
      let text = "";
      process.stdin.setRawMode(true);
      process.stdin.resume();

      const onData = (chunk) => {
        const char = chunk.toString();
        if (char === "\u0003") { // Ctrl+C
          process.stdin.removeListener("data", onData);
          process.stdin.setRawMode(false);
          rl.close();
          process.stdout.write("\n");
          process.exit(1);
        } else if (char === "\r" || char === "\n") {
          process.stdin.removeListener("data", onData);
          process.stdin.setRawMode(false);
          rl.close();
          process.stdout.write("\n");
          resolve(text);
        } else if (char === "\u0008" || char === "\u007f") { // Backspace
          if (text.length > 0) {
            text = text.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else {
          text += char;
          process.stdout.write("*");
        }
      };

      process.stdin.on("data", onData);
    } else {
      rl.question(query, (ans) => {
        rl.close();
        resolve(ans);
      });
    }
  });
}

function formatErrorMessage(err) {
  if (!err) return "Erro desconhecido";
  if (err.message && err.message.trim()) return err.message;
  if (Array.isArray(err.errors) && err.errors.length > 0) {
    return err.errors.map(e => e.message || e.code || String(e)).join(" | ");
  }
  if (err.code === "ECONNREFUSED" || err.code === "EACCES") {
    return `Falha de conexão com o banco de dados (${err.code}). Verifique se o PostgreSQL está iniciado e rodando.`;
  }
  return String(err);
}

async function main() {
  console.log("=== Criação de Bibliotecário (BiblioFácil) ===\n");

  let [nome, rawEmail, password] = process.argv.slice(2);

  if (!nome) {
    nome = await askQuestion("Nome completo do Bibliotecário: ");
  }
  nome = String(nome || "").trim();
  if (!nome) {
    throw new Error("O nome é obrigatório.");
  }

  if (!rawEmail) {
    rawEmail = await askQuestion("E-mail do Bibliotecário: ");
  }
  const email = String(rawEmail || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("E-mail inválido.");
  }

  if (!password) {
    password = await askQuestion("Senha (mínimo 8 caracteres): ", true);
  }
  password = String(password || "").trim();
  if (password.length < 8) {
    throw new Error("A senha deve ter pelo menos 8 caracteres.");
  }

  console.log("\nProcessando cadastro...");
  const passwordHash = await bcrypt.hash(password, 10);

  // Testa conexão e verifica se o usuário já existe
  const check = await db.query("SELECT id, tipo FROM users WHERE email = $1", [email]);
  if (check.rows.length > 0) {
    const existing = check.rows[0];
    await db.query(
      "UPDATE users SET nome = $1, password_hash = $2, tipo = 'bibliotecario' WHERE id = $3",
      [nome, passwordHash, existing.id]
    );
    console.log(`\n Sucesso: Usuário '${email}' atualizado para o perfil 'bibliotecario'.`);
  } else {
    await db.query(
      `INSERT INTO users (nome, email, password_hash, tipo)
       VALUES ($1, $2, $3, 'bibliotecario')`,
      [nome, email, passwordHash]
    );
    console.log(`\n Sucesso: Bibliotecário criado com sucesso (${email}).`);
  }
}

main()
  .catch((error) => {
    console.error("\n❌ Erro ao criar bibliotecário:", formatErrorMessage(error));
    process.exitCode = 1;
  })
  .finally(() => {
    if (db && typeof db.end === "function") {
      db.end().catch(() => {});
    }
  });
