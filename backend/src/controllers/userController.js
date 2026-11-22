const crypto = require("crypto");
const bcrypt = require("bcrypt");
const db = require("../config/db");

const BCRYPT_ROUNDS = 10;

/**
 * Gera hash bcrypt da senha.
 */
async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compara senha com o hash armazenado.
 * Suporta hashes bcrypt (novos) e SHA-256 hex legados (migração transparente).
 * Se a senha estiver correta e ainda for SHA-256, re-hasheia com bcrypt automaticamente.
 */
async function verifyPassword(inputPassword, storedHash, userId) {
  const isBcrypt = /^\$2[aby]\$/.test(storedHash);

  if (isBcrypt) {
    return { valid: await bcrypt.compare(inputPassword, storedHash), upgraded: false };
  }

  // Fallback: hash SHA-256 legado
  const legacyHash = crypto.createHash("sha256").update(inputPassword).digest("hex");
  if (legacyHash !== storedHash) {
    return { valid: false, upgraded: false };
  }

  // Senha correta — faz upgrade silencioso para bcrypt
  if (userId) {
    const newHash = await bcrypt.hash(inputPassword, BCRYPT_ROUNDS);
    await db
      .query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, userId])
      .catch((err) => console.error("Erro ao fazer upgrade de senha para bcrypt:", err));
  }
  return { valid: true, upgraded: true };
}

function sha256Hex(s) {
  return crypto.createHash("sha256").update(String(s)).digest("hex");
}

function randomToken() {
  return crypto.randomBytes(32).toString("hex");
}

function sanitizeUser(user) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    tipo: user.tipo,
    created_at: user.created_at,
  };
}

// CADASTRO
const registerUser = async (req, res) => {
  const nome = String(req.body.nome || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!nome || !email || !password) {
    return res
      .status(400)
      .json({ error: "Preencha nome, e-mail e senha." });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres." });
  }

  try {
    const query = `
      INSERT INTO users (nome, email, password_hash, tipo)
      VALUES ($1, $2, $3, 'leitor')
      RETURNING id, nome, email, tipo, created_at
    `;
    const values = [nome, email, await hashPassword(password)];
    const result = await db.query(query, values);
    const user = result.rows[0];

    // cria sessão no banco (expira em 12h) para login automático
    const token = randomToken();
    const tokenHash = sha256Hex(token);
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO auth_sessions
        (id, user_id, token_hash, user_nome, user_email, user_tipo, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [sessionId, user.id, tokenHash, user.nome, user.email, user.tipo, expiresAt.toISOString()]
    );

    // cookie httpOnly para não depender de localStorage
    res.cookie("biblioFacil_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // em produção: true (https)
      maxAge: 12 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(201).json({
      message: "Usuário cadastrado com sucesso.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Este e-mail já está cadastrado." });
    }
    console.error("Erro ao cadastrar:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
};

// LOGIN
const authenticateUser = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ error: "Informe e-mail e senha." });
  }

  try {
    const result = await db.query(
      "SELECT id, nome, email, tipo, password_hash, created_at FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    const user = result.rows[0];
    const { valid } = await verifyPassword(password, user.password_hash, user.id);
    if (!valid) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    // cria sessão no banco (expira em 12h)
    const token = randomToken();
    const tokenHash = sha256Hex(token);
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO auth_sessions
        (id, user_id, token_hash, user_nome, user_email, user_tipo, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [sessionId, user.id, tokenHash, user.nome, user.email, user.tipo, expiresAt.toISOString()]
    );

    // cookie httpOnly para não depender de localStorage
    res.cookie("biblioFacil_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // em produção: true (https)
      maxAge: 12 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      message: "Login realizado com sucesso.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Erro ao logar:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
};

const logoutUser = async (req, res) => {
  try {
    const sessionId = req.user?.session_id;
    if (sessionId) {
      await db.query("DELETE FROM auth_sessions WHERE id = $1", [sessionId]);
    }
    res.clearCookie("biblioFacil_token", { path: "/" });
    return res.status(200).json({ message: "Logout realizado." });
  } catch (error) {
    console.error("Erro ao deslogar:", error);
    return res.status(500).json({ error: "Erro ao deslogar." });
  }
};

const registerBibliotecario = async (req, res) => {
  const nome = String(req.body.nome || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!nome || !email || !password) {
    return res.status(400).json({ error: "Preencha nome, e-mail e senha." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres." });
  }

  try {
    const result = await db.query(
      `INSERT INTO users (nome, email, password_hash, tipo)
       VALUES ($1, $2, $3, 'bibliotecario')
       RETURNING id, nome, email, tipo, created_at`,
      [nome, email, await hashPassword(password)]
    );
    return res.status(201).json({
      message: "Bibliotecário cadastrado com sucesso.",
      user: sanitizeUser(result.rows[0]),
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Este e-mail já está cadastrado." });
    }
    console.error("Erro ao cadastrar bibliotecário:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
};

module.exports = { registerUser, authenticateUser, logoutUser, registerBibliotecario };