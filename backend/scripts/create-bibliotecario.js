const bcrypt = require("bcrypt");
const db = require("../src/config/db");

function readPassword() {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    if (!input.isTTY || typeof input.setRawMode !== "function") {
      reject(new Error("Execute este comando em um terminal interativo."));
      return;
    }

    process.stdout.write("Senha (mínimo 8 caracteres): ");
    input.setRawMode(true);
    input.resume();

    let password = "";
    const onData = (keyBuffer) => {
      const key = keyBuffer.toString();
      if (key === "\u0003") {
        input.removeListener("data", onData);
        input.setRawMode(false);
        input.pause();
        process.stdout.write("\n");
        reject(new Error("Operação cancelada."));
        return;
      }
      if (key === "\r" || key === "\n") {
        input.removeListener("data", onData);
        input.setRawMode(false);
        input.pause();
        process.stdout.write("\n");
        resolve(password);
        return;
      }
      if (key === "\u0008" || key === "\u007f") {
        password = password.slice(0, -1);
        return;
      }
      password += key;
    };

    input.on("data", onData);
  });
}

async function main() {
  const [nome, rawEmail] = process.argv.slice(2);
  const email = String(rawEmail || "").trim().toLowerCase();
  if (!nome || !email) {
    throw new Error('Uso: npm run create-bibliotecario -- "Nome" "email@exemplo.com"');
  }

  const password = await readPassword();
  if (password.length < 8) {
    throw new Error("A senha deve ter pelo menos 8 caracteres.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.query(
    `INSERT INTO users (nome, email, password_hash, tipo)
     VALUES ($1, $2, $3, 'bibliotecario')`,
    [nome.trim(), email, passwordHash]
  );
  console.log(`Bibliotecário criado: ${email}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
