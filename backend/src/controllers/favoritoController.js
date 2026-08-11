const db = require("../config/db");

/** GET /livros/favoritos */
const listarFavoritos = async (req, res) => {
  const userId = Number(req.user?.sub);
  if (Number.isNaN(userId)) {
    return res.status(401).json({ error: "Sessão inválida." });
  }

  try {
    const result = await db.query(
      `SELECT f.id AS favorito_id, f.created_at AS favoritado_em,
              l.id, l.titulo, l.autor, l.genero, l.capa_url, l.status,
              COALESCE(l.quantidade_exemplares, 1) AS quantidade_exemplares,
              GREATEST(0, COALESCE(l.quantidade_exemplares, 1) - (
                COALESCE((SELECT COUNT(*) FROM reservas r WHERE r.livro_id = l.id AND r.status = 'pendente'), 0) +
                COALESCE((SELECT COUNT(*) FROM emprestimos e WHERE e.livro_id = l.id AND e.status = 'ativo'), 0)
              )) AS exemplares_disponiveis,
              COALESCE((SELECT ROUND(AVG(a.nota)::numeric, 1) FROM avaliacoes a WHERE a.livro_id = l.id), 0) AS media_avaliacao
       FROM favoritos f
       JOIN livros l ON l.id = f.livro_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({ items: result.rows });
  } catch (error) {
    console.error("Erro ao listar favoritos:", error);
    res.status(500).json({ error: "Erro ao buscar favoritos." });
  }
};

/** GET /livros/:id/favorito */
const verificarFavorito = async (req, res) => {
  const livroId = Number(req.params.id);
  const userId = Number(req.user?.sub);

  if (Number.isNaN(livroId)) return res.status(400).json({ error: "ID inválido." });
  if (Number.isNaN(userId)) return res.status(401).json({ error: "Sessão inválida." });

  try {
    const result = await db.query(
      "SELECT id FROM favoritos WHERE livro_id = $1 AND user_id = $2",
      [livroId, userId]
    );
    res.json({ favoritado: result.rows.length > 0 });
  } catch (error) {
    console.error("Erro ao verificar favorito:", error);
    res.status(500).json({ error: "Erro ao verificar favorito." });
  }
};

/** POST /livros/:id/favoritar — adiciona ou remove (toggle) */
const adicionarFavorito = async (req, res) => {
  const livroId = Number(req.params.id);
  const userId = Number(req.user?.sub);

  if (Number.isNaN(livroId)) return res.status(400).json({ error: "ID inválido." });
  if (Number.isNaN(userId)) return res.status(401).json({ error: "Sessão inválida." });

  try {
    const livroExists = await db.query("SELECT 1 FROM livros WHERE id = $1", [livroId]);
    if (livroExists.rows.length === 0) {
      return res.status(404).json({ error: "Livro não encontrado." });
    }

    const existing = await db.query(
      "SELECT id FROM favoritos WHERE livro_id = $1 AND user_id = $2",
      [livroId, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(200).json({ message: "Livro já está nos favoritos.", favoritado: true });
    }

    await db.query(
      "INSERT INTO favoritos (user_id, livro_id) VALUES ($1, $2)",
      [userId, livroId]
    );

    res.status(201).json({ message: "Livro adicionado aos favoritos.", favoritado: true });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(200).json({ message: "Livro já está nos favoritos.", favoritado: true });
    }
    console.error("Erro ao favoritar:", error);
    res.status(500).json({ error: "Erro ao favoritar livro." });
  }
};

/** DELETE /livros/:id/favoritar */
const removerFavorito = async (req, res) => {
  const livroId = Number(req.params.id);
  const userId = Number(req.user?.sub);

  if (Number.isNaN(livroId)) return res.status(400).json({ error: "ID inválido." });
  if (Number.isNaN(userId)) return res.status(401).json({ error: "Sessão inválida." });

  try {
    const result = await db.query(
      "DELETE FROM favoritos WHERE livro_id = $1 AND user_id = $2 RETURNING id",
      [livroId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Favorito não encontrado." });
    }

    res.json({ message: "Livro removido dos favoritos.", favoritado: false });
  } catch (error) {
    console.error("Erro ao remover favorito:", error);
    res.status(500).json({ error: "Erro ao remover favorito." });
  }
};

module.exports = {
  listarFavoritos,
  verificarFavorito,
  adicionarFavorito,
  removerFavorito,
};
