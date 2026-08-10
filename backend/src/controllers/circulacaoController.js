const db = require("../config/db");

// lista reservas aguardando retirada
const listRetiradasPendentes = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.id, r.livro_id, r.user_id, r.nome, r.email, r.data_retirada, r.data_limite,
              r.observacoes, r.status, r.created_at,
              l.titulo, l.autor, l.capa_url
       FROM reservas r
       JOIN livros l ON l.id = r.livro_id
       WHERE r.status = 'pendente'
       ORDER BY r.data_retirada ASC`
    );
    res.json({ items: result.rows });
  } catch (error) {
    console.error("Erro ao listar retiradas pendentes:", error);
    res.status(500).json({ error: "Erro ao buscar retiradas pendentes." });
  }
};

// lista empréstimos aguardando devolução
const listDevolucoesPendentes = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT e.id, e.user_id, e.livro_id, e.data_emprestimo, e.data_devolucao_prevista, e.status,
              l.titulo, l.autor, l.capa_url,
              u.nome AS user_nome, u.email AS user_email
       FROM emprestimos e
       JOIN livros l ON l.id = e.livro_id
       LEFT JOIN users u ON u.id = e.user_id
       WHERE e.status = 'ativo'
       ORDER BY e.data_devolucao_prevista ASC`
    );
    res.json({ items: result.rows });
  } catch (error) {
    console.error("Erro ao listar devoluções pendentes:", error);
    res.status(500).json({ error: "Erro ao buscar devoluções pendentes." });
  }
};

// confirma que o leitor retirou o livro reservado: reserva -> confirmada, cria empréstimo, livro -> emprestado
const confirmarRetirada = async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "ID inválido." });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const reservaResult = await client.query(
      "SELECT * FROM reservas WHERE id = $1 FOR UPDATE",
      [id]
    );
    if (reservaResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Reserva não encontrada." });
    }
    const reserva = reservaResult.rows[0];
    if (reserva.status !== "pendente") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Esta reserva já foi processada." });
    }

    await client.query("UPDATE reservas SET status = 'confirmada' WHERE id = $1", [id]);

    const emprestimo = await client.query(
      `INSERT INTO emprestimos (user_id, livro_id, data_emprestimo, data_devolucao_prevista, status)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3::date, 'ativo')
       RETURNING *`,
      [reserva.user_id, reserva.livro_id, reserva.data_limite]
    );

    const livroUpd = await client.query(
      "UPDATE livros SET status = 'emprestado' WHERE id = $1 AND status = 'reservado'",
      [reserva.livro_id]
    );
    if (livroUpd.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "O livro não está mais reservado." });
    }

    await client.query("COMMIT");
    res.json({ message: "Retirada confirmada.", emprestimo: emprestimo.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao confirmar retirada:", error);
    res.status(500).json({ error: "Erro ao confirmar retirada." });
  } finally {
    client.release();
  }
};

// confirma a devolução do livro: empréstimo -> devolvido, livro -> disponível
const confirmarDevolucao = async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "ID inválido." });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const emprestimoResult = await client.query(
      "SELECT * FROM emprestimos WHERE id = $1 FOR UPDATE",
      [id]
    );
    if (emprestimoResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Empréstimo não encontrado." });
    }
    const emprestimo = emprestimoResult.rows[0];
    if (emprestimo.status !== "ativo") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Este empréstimo já foi encerrado." });
    }

    await client.query(
      "UPDATE emprestimos SET status = 'devolvido', data_devolucao_real = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );
    await client.query(
      `UPDATE livros
       SET status = 'disponivel'
       WHERE id = $1 AND (
         COALESCE(quantidade_exemplares, 1) > (
           (SELECT COUNT(*) FROM reservas WHERE livro_id = $1 AND status = 'pendente') +
           (SELECT COUNT(*) FROM emprestimos WHERE livro_id = $1 AND status = 'ativo')
         )
       )`,
      [emprestimo.livro_id]
    );

    await client.query("COMMIT");
    res.json({ message: "Devolução confirmada." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao confirmar devolução:", error);
    res.status(500).json({ error: "Erro ao confirmar devolução." });
  } finally {
    client.release();
  }
};

// executa manualmente a limpeza de reservas expiradas
const executarLimpezaManual = async (req, res) => {
  try {
    const reservaCleanupService = require("../services/reservaCleanupService");
    const resultado = await reservaCleanupService.cancelarReservasExpiradas();
    res.json({
      message: "Limpeza de reservas expiradas realizada com sucesso.",
      resultado,
    });
  } catch (error) {
    console.error("Erro ao executar limpeza manual de reservas:", error);
    res.status(500).json({ error: "Erro ao executar limpeza de reservas expiradas." });
  }
};

module.exports = {
  listRetiradasPendentes,
  listDevolucoesPendentes,
  confirmarRetirada,
  confirmarDevolucao,
  executarLimpezaManual,
};
