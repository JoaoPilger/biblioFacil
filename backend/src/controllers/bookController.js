const db = require("../config/db");

function parseOptionalInt(value) {
    if (value === undefined || value === null || String(value).trim() === "") {
        return null;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
}

function parseOptionalYearToDate(value) {
    if (value === undefined || value === null || String(value).trim() === "") {
        return null;
    }
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
        return raw.slice(0, 10);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return raw;
    }
    if (/^\d{4}$/.test(raw)) {
        return `${raw}-01-01`;
    }
    return raw;
}

// buscar todos os livros
const getBooks = async (req, res) => {
    const { genero, limit, search } = req.query; 
    const params = [];
    const conditions = [];
    let query = "SELECT id, titulo, autor, genero, status, capa_url FROM livros";

    if (genero) {
        params.push(genero);
        conditions.push(`genero = $${params.length}`);
    }

    if (search) {
        params.push(`%${search}%`);
        
        conditions.push(`(titulo ILIKE $${params.length} OR autor ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC";

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
            "SELECT * FROM livros WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Livro não encontrado." });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({error: "Erro ao buscar o livro."})
    }
}

// cadastrar livro
const registerBook = async (req, res) => {
    const { titulo, autor, ano_publ, edicao, editora, genero, isbn, paginas, sinopse, capa} = req.body;
    console.log("Arquivo no Multer:", req.file);

    let capa_url = null;
    if (req.file) {
        capa_url = `/public/covers/${req.file.filename}`;
    }

    const anoFormatado = (ano_publ && ano_publ.trim() !== "") ? parseInt(ano_publ) : null;
    const paginasFormatadas = (paginas && paginas.trim() !== "") ? parseInt(paginas) : null;
    const edicaoFormatada = (edicao && edicao !== "") ? parseInt(edicao) : null;

    try {
        await db.query(
            "INSERT INTO livros (titulo, autor, ano_publ, edicao, editora, genero, isbn, paginas, sinopse, capa_url, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
            [titulo, autor, anoFormatado, edicaoFormatada, editora, genero, isbn, paginasFormatadas, sinopse, capa_url, "disponivel"]
        );
        res.status(201).json({ message: "Livro cadastrado!" });

    } catch (error) {
        console.error("Erro ao cadastrar livro:", error);
        res.status(500).json({ error: "Erro ao salvar no banco" });
    }
}

// editar livro
const modificateBook = async (req, res) => {
    const { titulo, autor, ano_publ, edicao, editora, genero, isbn, paginas, sinopse, status} = req.body;
    const capa_url = req.file?.filename ? `/public/covers/${req.file.filename}` : null;
    const id = Number(req.params.id);
    const anoFormatado = parseOptionalYearToDate(ano_publ);
    const paginasFormatadas = parseOptionalInt(paginas);
    const edicaoFormatada = parseOptionalInt(edicao);

    if (Number.isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
    }

    try {
        const result = await db.query(
            "UPDATE livros SET titulo = $1, autor = $2, ano_publ = $3, edicao = $4, editora = $5, genero = $6, isbn = $7, paginas = $8, sinopse = $9, status = $10, capa_url = COALESCE($11, capa_url) WHERE id = $12",
            [titulo, autor, anoFormatado, edicaoFormatada, editora, genero, isbn, paginasFormatadas, sinopse, status, capa_url, id]
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

/** POST /livros/:id/reservar — grava reserva e marca livro como reservado se estiver disponível */
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
            "SELECT id, status FROM livros WHERE id = $1 FOR UPDATE",
            [livroId]
        );
        if (lock.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Livro não encontrado." });
        }
        const st = String(lock.rows[0].status || "").toLowerCase();
        if (st !== "disponivel") {
            await client.query("ROLLBACK");
            return res.status(409).json({ error: "Este livro não está disponível para reserva." });
        }

        const ins = await client.query(
            `INSERT INTO reservas (livro_id, user_id, nome, email, data_retirada, data_limite, observacoes, status)
             VALUES ($1, $2, $3, $4, $5::date, $6::date, $7, 'pendente')
             RETURNING id, livro_id, user_id, nome, email, data_retirada, data_limite, observacoes, status, created_at`,
            [livroId, userId, nome, email, retiradaSql, limiteSql, observacoes]
        );

        const upd = await client.query(
            "UPDATE livros SET status = 'reservado' WHERE id = $1 AND status = 'disponivel'",
            [livroId]
        );
        if (upd.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({ error: "Não foi possível reservar o livro (conflito de status)." });
        }

        await client.query("COMMIT");
        return res.status(201).json({
            message: "Reserva registrada com sucesso.",
            reserva: ins.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Erro ao reservar livro:", error);
        if (error.code === "42P01") {
            return res.status(500).json({
                error: "Tabela de reservas não encontrada. Execute o script SQL atualizado (init.sql) no banco.",
            });
        }
        return res.status(500).json({ error: "Erro ao registrar reserva." });
    } finally {
        client.release();
    }
};

module.exports = { registerBook, modificateBook, getBooks, getBookId, deleteBook, reserveBook };