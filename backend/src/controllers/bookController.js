const db = require("../config/db");

function parseOptionalInt(value) {
    if (value === undefined || value === null || String(value).trim() === "") {
        return null;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
}

// buscar todos os livros
const getBooks = async (req, res) => {
    const { genero, limit, search } = req.query; 
    const params = [];
    const conditions = [];
    let query = `
      SELECT l.id, l.titulo, l.autor, l.genero, l.status, l.capa_url, COALESCE(l.quantidade_exemplares, 1) AS quantidade_exemplares,
             GREATEST(0, COALESCE(l.quantidade_exemplares, 1) - (
               COALESCE((SELECT COUNT(*) FROM reservas r WHERE r.livro_id = l.id AND r.status = 'pendente'), 0) +
               COALESCE((SELECT COUNT(*) FROM emprestimos e WHERE e.livro_id = l.id AND e.status = 'ativo'), 0)
             )) AS exemplares_disponiveis
      FROM livros l`;

    if (genero) {
        params.push(genero);
        conditions.push(`l.genero = $${params.length}`);
    }

    if (search) {
        params.push(`%${search}%`);
        conditions.push(`(l.titulo ILIKE $${params.length} OR l.autor ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY l.created_at DESC";

    if (limit) {
        params.push(parseInt(limit));
        query += ` LIMIT $${params.length}`;
    }

    try {
        const result = await db.query(query, params);
        res.json({ items: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar livros." });
    }
};

// get livro por id
const getBookId = async (req, res) => {
    const id = Number(req.params.id);
    
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
    }

    try {
        const result = await db.query(
            `SELECT l.*,
                    COALESCE((SELECT COUNT(*) FROM reservas r WHERE r.livro_id = l.id AND r.status = 'pendente'), 0) AS reservas_ativas,
                    COALESCE((SELECT COUNT(*) FROM emprestimos e WHERE e.livro_id = l.id AND e.status = 'ativo'), 0) AS emprestimos_ativos
             FROM livros l
             WHERE l.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Livro não encontrado." });
        }

        const book = result.rows[0];
        const qtd = Math.max(1, Number(book.quantidade_exemplares) || 1);
        const ocupados = Number(book.reservas_ativas) + Number(book.emprestimos_ativos);
        const disponiveis = Math.max(0, qtd - ocupados);

        book.quantidade_exemplares = qtd;
        book.exemplares_disponiveis = disponiveis;
        book.exemplares_ocupados = ocupados;

        res.json(book);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Erro ao buscar o livro."})
    }
}

// cadastrar livro
const registerBook = async (req, res) => {
    const { titulo, autor, ano_publ, edicao, editora, genero, isbn, paginas, sinopse, capa, quantidade_exemplares} = req.body;
    console.log("Arquivo no Multer:", req.file);

    let capa_url = null;
    if (req.file) {
        capa_url = `/public/covers/${req.file.filename}`;
    }

    const anoFormatado = (ano_publ && String(ano_publ).trim() !== "") ? parseInt(ano_publ) : null;
    const paginasFormatadas = (paginas && String(paginas).trim() !== "") ? parseInt(paginas) : null;
    const edicaoFormatada = (edicao && String(edicao) !== "") ? parseInt(edicao) : null;
    const qtdExemplares = (quantidade_exemplares && !Number.isNaN(parseInt(quantidade_exemplares)))
      ? Math.max(1, parseInt(quantidade_exemplares))
      : 1;

    try {
        await db.query(
            "INSERT INTO livros (titulo, autor, ano_publ, edicao, editora, genero, isbn, paginas, sinopse, capa_url, status, quantidade_exemplares) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
            [titulo, autor, anoFormatado, edicaoFormatada, editora, genero, isbn, paginasFormatadas, sinopse, capa_url, "disponivel", qtdExemplares]
        );
        res.status(201).json({ message: "Livro cadastrado!" });

    } catch (error) {
        console.error("Erro ao cadastrar livro:", error);
        res.status(500).json({ error: "Erro ao salvar no banco" });
    }
}

// editar livro
const modificateBook = async (req, res) => {
    const { titulo, autor, ano_publ, edicao, editora, genero, isbn, paginas, sinopse, status, quantidade_exemplares} = req.body;
    const capa_url = req.file?.filename ? `/public/covers/${req.file.filename}` : null;
    const id = Number(req.params.id);
    const anoFormatado = parseOptionalInt(ano_publ);
    const paginasFormatadas = parseOptionalInt(paginas);
    const edicaoFormatada = parseOptionalInt(edicao);
    const parsedQtd = parseOptionalInt(quantidade_exemplares);
    const qtdExemplares = (parsedQtd && parsedQtd >= 1) ? parsedQtd : 1;

    if (Number.isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
    }

    try {
        // Obter contagem de reservas/empréstimos ativos
        const counts = await db.query(
            `SELECT
               COALESCE((SELECT COUNT(*) FROM reservas WHERE livro_id = $1 AND status = 'pendente'), 0) AS reservas_ativas,
               COALESCE((SELECT COUNT(*) FROM emprestimos WHERE livro_id = $1 AND status = 'ativo'), 0) AS emprestimos_ativos`,
            [id]
        );
        const ocupados = Number(counts.rows[0].reservas_ativas) + Number(counts.rows[0].emprestimos_ativos);
        const novoStatus = (qtdExemplares > ocupados) ? "disponivel" : (status || "indisponivel");

        const result = await db.query(
            `UPDATE livros
             SET titulo = $1, autor = $2, ano_publ = $3, edicao = $4, editora = $5, genero = $6, isbn = $7,
                 paginas = $8, sinopse = $9, status = $10, capa_url = COALESCE($11, capa_url),
                 quantidade_exemplares = $12
             WHERE id = $13`,
            [titulo, autor, anoFormatado, edicaoFormatada, editora, genero, isbn, paginasFormatadas, sinopse, novoStatus, capa_url, qtdExemplares, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Livro não encontrado." });
        }

        res.status(201).json({ message: "Livro atualizado" });

    } catch (error) {
        console.error("Erro ao atualizar livro:", error);
        if (error.code === "23505") {
            return res.status(409).json({ error: "ISBN já cadastrado para outro livro." });
        }
        res.status(500).json({ error: "Erro ao atualizar", details: error.message });
    }
}

const deleteBook = async (req, res) => {
    const { id } = req.params
    try {
        const result = await db.query("DELETE FROM livros WHERE id = $1", [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({message:"Livro não encontrado."});
        }

        res.status(200).json({message:"Livro deletado com sucesso."});
    } catch (error) {
        console.error("Erro ao deletar livro:", error);
        res.status(500).json({error: "Erro ao deletar livro."})
    }
}

function parseDateOnlyBr(s) {
    const raw = String(s ?? "").trim();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    return new Date(y, mo - 1, d, 0, 0, 0, 0);
}

function startOfTodayLocal() {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 0, 0, 0, 0);
}

function diffDaysInclusive(a, b) {
    const ms = b.getTime() - a.getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24));
}

function toSqlDateLocal(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

/** POST /livros/:id/reservar — grava reserva e marca livro como indisponivel se esgotar exemplares */
const reserveBook = async (req, res) => {
    const livroId = Number(req.params.id);
    if (Number.isNaN(livroId)) {
        return res.status(400).json({ error: "ID do livro inválido." });
    }

    if (!req.user || req.user.sub == null) {
        return res.status(401).json({ error: "É necessário estar logado para reservar." });
    }

    const nome = String(req.body.nome ?? "").trim();
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const retiradaRaw = req.body.retirada;
    const limiteRaw = req.body.limite;
    const observacoes = String(req.body.observacoes ?? "").trim() || null;

    const userId = Number(req.user.sub);
    if (Number.isNaN(userId)) {
        return res.status(401).json({ error: "Sessão inválida. Faça login novamente." });
    }

    if (!nome || !email) {
        return res.status(400).json({ error: "Informe nome e e-mail." });
    }

    const dataRetirada = parseDateOnlyBr(retiradaRaw);
    const dataLimite = parseDateOnlyBr(limiteRaw);
    if (!dataRetirada || !dataLimite) {
        return res.status(400).json({ error: "Datas de retirada e limite inválidas (use YYYY-MM-DD)." });
    }

    const hoje = startOfTodayLocal();
    if (dataRetirada.getTime() < hoje.getTime()) {
        return res.status(400).json({ error: "A data de retirada não pode ser no passado." });
    }
    if (dataLimite.getTime() < dataRetirada.getTime()) {
        return res.status(400).json({ error: "A data limite deve ser igual ou posterior à retirada." });
    }
    const span = diffDaysInclusive(dataRetirada, dataLimite);
    if (span > 14) {
        return res.status(400).json({ error: "O período reservado não pode ultrapassar 14 dias após a retirada." });
    }

    const retiradaSql = toSqlDateLocal(dataRetirada);
    const limiteSql = toSqlDateLocal(dataLimite);

    const client = await db.connect();
    try {
        await client.query("BEGIN");

        const lock = await client.query(
            `SELECT l.id, l.status, COALESCE(l.quantidade_exemplares, 1) AS quantidade_exemplares,
                    COALESCE((SELECT COUNT(*) FROM reservas r WHERE r.livro_id = l.id AND r.status = 'pendente'), 0) AS reservas_ativas,
                    COALESCE((SELECT COUNT(*) FROM emprestimos e WHERE e.livro_id = l.id AND e.status = 'ativo'), 0) AS emprestimos_ativos
             FROM livros l WHERE l.id = $1 FOR UPDATE`,
            [livroId]
        );
        if (lock.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Livro não encontrado." });
        }

        const book = lock.rows[0];
        const totalQtd = Math.max(1, Number(book.quantidade_exemplares) || 1);
        const ocupados = Number(book.reservas_ativas) + Number(book.emprestimos_ativos);
        const disponiveis = totalQtd - ocupados;

        if (disponiveis <= 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({ error: "Não há exemplares disponíveis para este livro no momento." });
        }

        // Valida se o usuário já possui 1 exemplar reservado ou emprestado
        const possuiJa = await client.query(
            `SELECT 1 FROM (
               SELECT user_id FROM reservas WHERE livro_id = $1 AND user_id = $2 AND status = 'pendente'
               UNION ALL
               SELECT user_id FROM emprestimos WHERE livro_id = $1 AND user_id = $2 AND status = 'ativo'
             ) AS t LIMIT 1`,
            [livroId, userId]
        );
        if (possuiJa.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({ error: "Você já possui um exemplar deste livro emprestado ou reservado." });
        }

        const ins = await client.query(
            `INSERT INTO reservas (livro_id, user_id, nome, email, data_retirada, data_limite, observacoes, status)
             VALUES ($1, $2, $3, $4, $5::date, $6::date, $7, 'pendente')
             RETURNING id, livro_id, user_id, nome, email, data_retirada, data_limite, observacoes, status, created_at`,
            [livroId, userId, nome, email, retiradaSql, limiteSql, observacoes]
        );

        if (disponiveis - 1 <= 0) {
            await client.query(
                "UPDATE livros SET status = 'indisponivel' WHERE id = $1",
                [livroId]
            );
        }

        await client.query("COMMIT");
        return res.status(201).json({
            message: "Reserva registrada com sucesso.",
            reserva: ins.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Erro ao reservar livro:", error);
        return res.status(500).json({ error: "Erro ao registrar reserva." });
    } finally {
        client.release();
    }
};

/** GET /livros/:id/minha-reserva — retorna a reserva pendente do usuário logado para este livro, se houver */
const getMinhaReserva = async (req, res) => {
    const livroId = Number(req.params.id);
    if (Number.isNaN(livroId)) {
        return res.status(400).json({ error: "ID inválido." });
    }

    const userId = Number(req.user?.sub);
    if (Number.isNaN(userId)) {
        return res.status(401).json({ error: "Sessão inválida." });
    }

    try {
        const result = await db.query(
            `SELECT id, livro_id, data_retirada, data_limite, status, created_at
             FROM reservas
             WHERE livro_id = $1 AND user_id = $2 AND status = 'pendente'
             ORDER BY created_at DESC
             LIMIT 1`,
            [livroId, userId]
        );
        res.json({ reserva: result.rows[0] || null });
    } catch (error) {
        console.error("Erro ao buscar reserva do usuário:", error);
        res.status(500).json({ error: "Erro ao buscar reserva." });
    }
};

/** POST /livros/:id/reserva/cancelar — cancela a reserva pendente do usuário logado para este livro */
const cancelarReserva = async (req, res) => {
    const livroId = Number(req.params.id);
    if (Number.isNaN(livroId)) {
        return res.status(400).json({ error: "ID inválido." });
    }

    const userId = Number(req.user?.sub);
    if (Number.isNaN(userId)) {
        return res.status(401).json({ error: "Sessão inválida." });
    }

    const client = await db.connect();
    try {
        await client.query("BEGIN");

        const reservaResult = await client.query(
            `SELECT id FROM reservas WHERE livro_id = $1 AND user_id = $2 AND status = 'pendente' FOR UPDATE`,
            [livroId, userId]
        );
        if (reservaResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Nenhuma reserva pendente encontrada." });
        }
        const reservaId = reservaResult.rows[0].id;

        await client.query("UPDATE reservas SET status = 'cancelada' WHERE id = $1", [reservaId]);
        await client.query(
            `UPDATE livros
             SET status = 'disponivel'
             WHERE id = $1 AND (
               COALESCE(quantidade_exemplares, 1) > (
                 (SELECT COUNT(*) FROM reservas WHERE livro_id = $1 AND status = 'pendente') +
                 (SELECT COUNT(*) FROM emprestimos WHERE livro_id = $1 AND status = 'ativo')
               )
             )`,
            [livroId]
        );

        await client.query("COMMIT");
        res.json({ message: "Reserva cancelada." });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Erro ao cancelar reserva:", error);
        res.status(500).json({ error: "Erro ao cancelar reserva." });
    } finally {
        client.release();
    }
};


/** GET /livros/:id/meu-emprestimo — retorna o empréstimo ativo do usuário logado para este livro, se houver */
const getMeuEmprestimo = async (req, res) => {
    const livroId = Number(req.params.id);
    if (Number.isNaN(livroId)) {
        return res.status(400).json({ error: "ID inválido." });
    }

    const userId = Number(req.user?.sub);
    if (Number.isNaN(userId)) {
        return res.status(401).json({ error: "Sessão inválida." });
    }

    try {
        const result = await db.query(
            `SELECT id, livro_id, data_emprestimo, data_devolucao_prevista, status
             FROM emprestimos
             WHERE livro_id = $1 AND user_id = $2 AND status = 'ativo'
             ORDER BY data_emprestimo DESC
             LIMIT 1`,
            [livroId, userId]
        );
        res.json({ emprestimo: result.rows[0] || null });
    } catch (error) {
        console.error("Erro ao buscar empréstimo do usuário:", error);
        res.status(500).json({ error: "Erro ao buscar empréstimo." });
    }
};

/** GET /livros/minhas-reservas — lista as reservas e empréstimos (ativos e histórico) do usuário logado */
const getMinhasReservas = async (req, res) => {
    const userId = Number(req.user?.sub);
    if (Number.isNaN(userId)) {
        return res.status(401).json({ error: "Sessão inválida." });
    }

    try {
        const reservasResult = await db.query(
            `SELECT r.id, r.livro_id, r.status, r.data_retirada, r.data_limite, r.observacoes, r.created_at,
                    l.titulo, l.autor, l.capa_url
             FROM reservas r
             JOIN livros l ON l.id = r.livro_id
             WHERE r.user_id = $1
             ORDER BY r.created_at DESC`,
            [userId]
        );

        const emprestimosResult = await db.query(
            `SELECT
               e.id,
               e.livro_id,
               e.status,
               e.data_emprestimo,
               e.data_devolucao_prevista,
               e.data_devolucao_real,
               e.renovacoes,
               l.titulo,
               l.autor,
               l.capa_url,
               -- Dias de atraso (0 se ainda no prazo)
               GREATEST(0, CURRENT_DATE - e.data_devolucao_prevista::date) AS dias_atraso,
               -- Multa acumulada em R$
               GREATEST(0, CURRENT_DATE - e.data_devolucao_prevista::date)
                 * (SELECT valor FROM config_multa WHERE chave = 'multa_diaria') AS multa_acumulada,
               -- Pode renovar: ativo + sem reservas pendentes de outros + menos de 2 renovações
               CASE
                 WHEN e.status = 'ativo'
                   AND e.renovacoes < 2
                   AND NOT EXISTS (
                     SELECT 1 FROM reservas r2
                     WHERE r2.livro_id = e.livro_id
                       AND r2.user_id  <> $1
                       AND r2.status   = 'pendente'
                   )
                 THEN TRUE
                 ELSE FALSE
               END AS pode_renovar
             FROM emprestimos e
             JOIN livros l ON l.id = e.livro_id
             WHERE e.user_id = $1
             ORDER BY e.data_emprestimo DESC`,
            [userId]
        );

        res.json({ reservas: reservasResult.rows, emprestimos: emprestimosResult.rows });
    } catch (error) {
        console.error("Erro ao buscar minhas reservas:", error);
        res.status(500).json({ error: "Erro ao buscar suas reservas." });
    }
};

/** POST /livros/emprestimos/:id/renovar — estende prazo do empréstimo em 7 dias (máximo 2 renovações) */
const renovarEmprestimo = async (req, res) => {
    const emprestimoId = Number(req.params.id);
    if (Number.isNaN(emprestimoId)) {
        return res.status(400).json({ error: "ID de empréstimo inválido." });
    }

    const userId = Number(req.user?.sub);
    if (Number.isNaN(userId)) {
        return res.status(401).json({ error: "Sessão inválida." });
    }

    const client = await db.connect();
    try {
        await client.query("BEGIN");

        // Busca o empréstimo com lock
        const empResult = await client.query(
            `SELECT id, user_id, livro_id, status, data_devolucao_prevista, renovacoes
             FROM emprestimos WHERE id = $1 FOR UPDATE`,
            [emprestimoId]
        );
        if (empResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Empréstimo não encontrado." });
        }
        const emp = empResult.rows[0];

        // Valida dono
        if (Number(emp.user_id) !== userId) {
            await client.query("ROLLBACK");
            return res.status(403).json({ error: "Acesso negado." });
        }
        // Valida status
        if (emp.status !== "ativo") {
            await client.query("ROLLBACK");
            return res.status(409).json({ error: "Apenas empréstimos ativos podem ser renovados." });
        }
        // Valida limite de renovações
        if (emp.renovacoes >= 2) {
            await client.query("ROLLBACK");
            return res.status(409).json({ error: "Limite de renovações atingido (máximo 2)." });
        }

        // Verifica reservas pendentes de outros usuários para o mesmo livro
        const reservaConflito = await client.query(
            `SELECT 1 FROM reservas
             WHERE livro_id = $1 AND user_id <> $2 AND status = 'pendente'
             LIMIT 1`,
            [emp.livro_id, userId]
        );
        if (reservaConflito.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({ error: "Renovação indisponível: livro reservado por outro leitor." });
        }

        // Extende 7 dias a partir da data de devolução prevista atual
        const updated = await client.query(
            `UPDATE emprestimos
             SET data_devolucao_prevista = (data_devolucao_prevista::date + INTERVAL '7 days')::date,
                 renovacoes = renovacoes + 1
             WHERE id = $1
             RETURNING id, data_devolucao_prevista, renovacoes`,
            [emprestimoId]
        );

        await client.query("COMMIT");
        res.json({
            message: "Empréstimo renovado com sucesso.",
            emprestimo: updated.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Erro ao renovar empréstimo:", error);
        res.status(500).json({ error: "Erro ao renovar empréstimo." });
    } finally {
        client.release();
    }
};

module.exports = {
    registerBook,
    modificateBook,
    getBooks,
    getBookId,
    deleteBook,
    reserveBook,
    getMinhaReserva,
    cancelarReserva,
    getMeuEmprestimo,
    getMinhasReservas,
    renovarEmprestimo,
};