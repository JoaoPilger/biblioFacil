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
    try {
        const result = await db.query(
            "SELECT id, titulo, autor, genero, status FROM livros ORDER BY created_at DESC"
        )
        res.json(result.rows);

    } catch (error) {
        res.status(500).json({error: "Erro ao buscar livros."});
    }
}

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

module.exports = { registerBook, modificateBook, getBooks, getBookId, deleteBook};