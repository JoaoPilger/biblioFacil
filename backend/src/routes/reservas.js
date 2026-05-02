const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authenticateToken = require("../middlewares/auth");

function isDateOnly(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function parseDateOnlyLocal(s) {
  // Converte YYYY-MM-DD em Date local (meia-noite) sem efeito de fuso.
  const [y, m, d] = s.split("-").map((x) => Number(x));
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.userId);
    const livroId = Number(req.body.bookId || req.body.livroId);
    const retirada = req.body.retirada;
    const limite = req.body.limite;
    const observacoes = String(req.body.observacoes || "").trim();

    if (!userId) return res.status(401).json({ error: "Token inválido." });
    if (!livroId) return res.status(400).json({ error: "Livro inválido." });
    if (!isDateOnly(retirada) || !isDateOnly(limite)) {
      return res.status(400).json({ error: "Datas inválidas." });
    }

    const retiradaDate = parseDateOnlyLocal(retirada);
    const limiteDate = parseDateOnlyLocal(limite);
    const maxLimite = addDays(retiradaDate, 14);

    if (limiteDate.getTime() < retiradaDate.getTime()) {
      return res.status(400).json({ error: "A data limite deve ser após a retirada." });
    }
    if (limiteDate.getTime() > maxLimite.getTime()) {
      return res.status(400).json({ error: "O limite máximo de reserva é de 14 dias." });
    }

    // Confere se o livro existe (compatível com tabelas `livro` ou `livros`)
    let book;
    try {
      book = await db.query("SELECT id_livro, status FROM livro WHERE id_livro = $1 LIMIT 1", [livroId]);
    } catch {
      book = await db.query("SELECT id, status FROM livros WHERE id = $1 LIMIT 1", [livroId]);
    }
    if (!book.rows.length) return res.status(404).json({ error: "Livro não encontrado." });

    // Usa a tabela existente `emprestimos` para registrar a reserva/retirada.
    // Mapeamento:
    // - retirada  -> data_emprestimo
    // - limite    -> data_devolucao_prevista
    // - status    -> 'ativo'
    const result = await db.query(
      `
        INSERT INTO emprestimos (user_id, livro_id, data_emprestimo, data_devolucao_prevista, status)
        VALUES ($1, $2, ($3::date)::timestamptz, ($4::date)::timestamptz, 'ativo')
        RETURNING *
      `,
      [userId, livroId, retirada, limite]
    );

    // Marca livro como reservado (compatível com `livro` ou `livros`)
    try {
      await db.query("UPDATE livro SET status = 'reservado' WHERE id_livro = $1", [livroId]);
    } catch {
      await db.query("UPDATE livros SET status = 'reservado' WHERE id = $1", [livroId]);
    }

    return res.status(201).json({
      emprestimo: result.rows[0],
      observacoes: observacoes || null,
    });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao criar reserva", details: err.message });
  }
});

module.exports = router;

