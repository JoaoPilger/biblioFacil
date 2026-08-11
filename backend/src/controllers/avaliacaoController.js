const db = require("../config/db");

const MAX_COMENTARIO = 2000;

function sanitizeComentario(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_COMENTARIO);
}

function parseNota(value) {
  const nota = Number.parseInt(value, 10);
  if (Number.isNaN(nota) || nota < 1 || nota > 5) return null;
  return nota;
}

async function usuarioLeuLivro(userId, livroId) {
  const result = await db.query(
    `SELECT 1 FROM emprestimos
     WHERE user_id = $1 AND livro_id = $2 AND status = 'devolvido'
     LIMIT 1`,
    [userId, livroId]
  );
  return result.rows.length > 0;
}

/** GET /livros/:id/avaliacoes */
const listarAvaliacoes = async (req, res) => {
  const livroId = Number(req.params.id);
  if (Number.isNaN(livroId)) {
    return res.status(400).json({ error: "ID inválido." });
  }

  try {
    const livroExists = await db.query("SELECT 1 FROM livros WHERE id = $1", [livroId]);
    if (livroExists.rows.length === 0) {
      return res.status(404).json({ error: "Livro não encontrado." });
    }

    const result = await db.query(
      `SELECT a.id, a.nota, a.comentario, a.created_at, a.updated_at,
              u.nome AS user_nome
       FROM avaliacoes a
       JOIN users u ON u.id = a.user_id
       WHERE a.livro_id = $1
       ORDER BY a.updated_at DESC`,
      [livroId]
    );

    const stats = await db.query(
      `SELECT COALESCE(ROUND(AVG(nota)::numeric, 1), 0) AS media,
              COUNT(*)::int AS total
       FROM avaliacoes WHERE livro_id = $1`,
      [livroId]
    );

    res.json({
      avaliacoes: result.rows,
      media: Number(stats.rows[0].media),
      total: stats.rows[0].total,
    });
  } catch (error) {
    console.error("Erro ao listar avaliações:", error);
    res.status(500).json({ error: "Erro ao buscar avaliações." });
  }
};

/** GET /livros/:id/avaliacoes/minha */
const getMinhaAvaliacao = async (req, res) => {
  const livroId = Number(req.params.id);
  const userId = Number(req.user?.sub);

  if (Number.isNaN(livroId)) return res.status(400).json({ error: "ID inválido." });
  if (Number.isNaN(userId)) return res.status(401).json({ error: "Sessão inválida." });

  try {
    const result = await db.query(
      `SELECT id, nota, comentario, created_at, updated_at
       FROM avaliacoes WHERE livro_id = $1 AND user_id = $2`,
      [livroId, userId]
    );

    const podeAvaliar = await usuarioLeuLivro(userId, livroId);

    res.json({
      avaliacao: result.rows[0] || null,
      pode_avaliar: podeAvaliar,
    });
  } catch (error) {
    console.error("Erro ao buscar minha avaliação:", error);
    res.status(500).json({ error: "Erro ao buscar avaliação." });
  }
};

/** POST /livros/:id/avaliacoes — criar ou atualizar (upsert) */
const salvarAvaliacao = async (req, res) => {
  const livroId = Number(req.params.id);
  const userId = Number(req.user?.sub);

  if (Number.isNaN(livroId)) return res.status(400).json({ error: "ID inválido." });
  if (Number.isNaN(userId)) return res.status(401).json({ error: "Sessão inválida." });

  const nota = parseNota(req.body.nota);
  if (nota === null) {
    return res.status(400).json({ error: "A nota deve ser um número entre 1 e 5." });
  }

  const comentario = sanitizeComentario(req.body.comentario);

  try {
    const livroExists = await db.query("SELECT 1 FROM livros WHERE id = $1", [livroId]);
    if (livroExists.rows.length === 0) {
      return res.status(404).json({ error: "Livro não encontrado." });
    }

    const leu = await usuarioLeuLivro(userId, livroId);
    if (!leu) {
      return res.status(403).json({
        error: "Você só pode avaliar livros que já leu e devolveu.",
      });
    }

    const result = await db.query(
      `INSERT INTO avaliacoes (user_id, livro_id, nota, comentario)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, livro_id)
       DO UPDATE SET nota = EXCLUDED.nota, comentario = EXCLUDED.comentario, updated_at = CURRENT_TIMESTAMP
       RETURNING id, nota, comentario, created_at, updated_at`,
      [userId, livroId, nota, comentario]
    );

    res.status(201).json({
      message: "Avaliação salva com sucesso.",
      avaliacao: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao salvar avaliação:", error);
    res.status(500).json({ error: "Erro ao salvar avaliação." });
  }
};

/** DELETE /livros/:id/avaliacoes/minha */
const excluirMinhaAvaliacao = async (req, res) => {
  const livroId = Number(req.params.id);
  const userId = Number(req.user?.sub);

  if (Number.isNaN(livroId)) return res.status(400).json({ error: "ID inválido." });
  if (Number.isNaN(userId)) return res.status(401).json({ error: "Sessão inválida." });

  try {
    const result = await db.query(
      "DELETE FROM avaliacoes WHERE livro_id = $1 AND user_id = $2 RETURNING id",
      [livroId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Avaliação não encontrada." });
    }

    res.json({ message: "Avaliação removida." });
  } catch (error) {
    console.error("Erro ao excluir avaliação:", error);
    res.status(500).json({ error: "Erro ao excluir avaliação." });
  }
};

module.exports = {
  listarAvaliacoes,
  getMinhaAvaliacao,
  salvarAvaliacao,
  excluirMinhaAvaliacao,
};
