const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
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
  const tipo = String(req.body.tipo || "").trim().toLowerCase();

  if (!nome || !email || !password || !tipo) {
    return res
      .status(400)
      .json({ error: "Preencha nome, e-mail, senha e tipo de usuário." });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres." });
  }

  if (tipo !== "leitor" && tipo !== "bibliotecario") {
    return res.status(400).json({ error: "Tipo de usuário inválido." });
  }

  try {
    const query = `
      INSERT INTO users (nome, email, password_hash, tipo)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nome, email, tipo, created_at
    `;
    const values = [nome, email, hashPassword(password), tipo];
    const result = await db.query(query, values);

    return res.status(201).json({
      message: "Usuário cadastrado com sucesso.",
      user: sanitizeUser(result.rows[0]),
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
    const inputPasswordHash = hashPassword(password);
    if (user.password_hash !== inputPasswordHash) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        tipo: user.tipo,
      },
      process.env.JWT_SECRET || "dev_secret_change_me",
      { expiresIn: "12h" }
    );

    return res.status(200).json({
      message: "Login realizado com sucesso.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Erro ao logar:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
};

module.exports = { registerUser, authenticateUser };