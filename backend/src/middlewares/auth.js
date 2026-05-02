const crypto = require("crypto");
const db = require("../config/db");

function sha256Hex(s) {
  return crypto.createHash("sha256").update(String(s)).digest("hex");
}

function getTokenFromRequest(req) {
  const authHeader = req.headers["authorization"];
  const bearer = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return bearer || req.cookies?.biblioFacil_token || null;
}

async function loadSession(token) {
  const tokenHash = sha256Hex(token);
  const result = await db.query(
    `SELECT id, user_id, user_nome, user_email, user_tipo, expires_at
     FROM auth_sessions
     WHERE token_hash = $1
     LIMIT 1`,
    [tokenHash]
  );
  return result.rows[0] || null;
}

const authenticateToken = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: "Token não fornecido" });
    }
    const session = await loadSession(token);
    if (!session) {
      return res.status(403).json({ error: "Token inválido ou expirado" });
    }
    const exp = new Date(session.expires_at);
    if (Number.isNaN(exp.getTime()) || exp.getTime() <= Date.now()) {
      // limpa sessão vencida
      await db.query("DELETE FROM auth_sessions WHERE id = $1", [session.id]).catch(() => {});
      return res.status(403).json({ error: "Token inválido ou expirado" });
    }
    req.session = session;
    req.user = {
      id: session.user_id,
      sub: session.user_id,
      nome: session.user_nome,
      email: session.user_email,
      tipo: session.user_tipo,
      session_id: session.id,
    };
    next();
  } catch (e) {
    console.error("Erro no auth middleware:", e);
    return res.status(500).json({ error: "Erro interno de autenticação." });
  }
};

/** Se houver token, valida; se não, segue sem erro. */
const optionalAuthenticate = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) return next();
  try {
    const session = await loadSession(token);
    if (!session) return next();
    const exp = new Date(session.expires_at);
    if (Number.isNaN(exp.getTime()) || exp.getTime() <= Date.now()) return next();
    req.session = session;
    req.user = {
      id: session.user_id,
      sub: session.user_id,
      nome: session.user_nome,
      email: session.user_email,
      tipo: session.user_tipo,
      session_id: session.id,
    };
    return next();
  } catch {
    return next();
  }
};

module.exports = authenticateToken;
module.exports.optionalAuthenticate = optionalAuthenticate;