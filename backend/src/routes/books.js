var express = require("express");
var pool = require("../config/db");

var router = express.Router();

function normalize(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

router.get("/", async function (req, res) {
  try {
    var genero = req.query.genero;
    var limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit <= 0) limit = 50;

    var query, params;

    if (genero) {
      query = `
        SELECT * FROM livro
        WHERE LOWER(TRIM(genero)) = $1
        LIMIT $2
      `;
      params = [normalize(genero), limit];
    } else {
      query = `SELECT * FROM livro LIMIT $1`;
      params = [limit];
    }

    var result = await pool.query(query, params);

    res.json({
      items: result.rows,
      total: result.rowCount,
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar livros", details: err.message });
  }
});

router.get("/random", async function (req, res) {
  try {
    var genero = req.query.genero;
    var query, params;

    if (genero) {
      query = `
        SELECT * FROM livro
        WHERE LOWER(TRIM(genero)) = $1
        ORDER BY RANDOM()
        LIMIT 1
      `;
      params = [normalize(genero)];
    } else {
      query = `SELECT * FROM livro ORDER BY RANDOM() LIMIT 1`;
      params = [];
    }

    var result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Nenhum livro encontrado." });
    }

    return res.json({ item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar livro aleatório", details: err.message });
  }
});

router.get("/:id", async function (req, res) {
  try {
    var id = parseInt(req.params.id, 10);

    var result = await pool.query(
      `SELECT * FROM livro WHERE id_livro = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Livro não encontrado." });
    }

    res.json({ item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar livro", details: err.message });
  }
});

router.post("/", async function (req, res) {
  try {
    var {
      titulo,
      autor,
      ano,
      edicao,
      editora,
      genero,
      paginas,
      sinopse,
      capa,
      isbn,
    } = req.body;

    var result = await pool.query(
      `INSERT INTO livro
        (titulo, autor, ano_publicacao, edicao, editora, genero, numero_paginas, sinopse, capa_url, status, isbn)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'disponivel', $10)
       RETURNING *`,
      [
        titulo   || "",
        autor    || "",
        ano      || null,
        edicao   || null,
        editora  || "",
        genero   || "",
        paginas  || null,
        sinopse  || "",
        capa     || null,
        isbn     || null,
      ]
    );

    res.status(201).json({
      message: "Livro adicionado com sucesso!",
      book: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao adicionar livro", details: err.message });
  }
});

router.put("/:id", async function (req, res) {
  try {
    var id = parseInt(req.params.id, 10);

    var current = await pool.query(
      `SELECT * FROM livro WHERE id_livro = $1`,
      [id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: "Livro não encontrado." });
    }

    var c = current.rows[0];
    var b = req.body;

    var result = await pool.query(
      `UPDATE livro SET
        titulo          = $1,
        autor           = $2,
        ano_publicacao  = $3,
        edicao          = $4,
        editora         = $5,
        genero          = $6,
        numero_paginas  = $7,
        sinopse         = $8,
        capa_url        = $9,
        status          = $10,
        isbn            = $11
       WHERE id_livro = $12
       RETURNING *`,
      [
        b.titulo   !== undefined ? b.titulo   : c.titulo,
        b.autor    !== undefined ? b.autor    : c.autor,
        b.ano      !== undefined ? b.ano      : c.ano_publicacao,
        b.edicao   !== undefined ? b.edicao   : c.edicao,
        b.editora  !== undefined ? b.editora  : c.editora,
        b.genero   !== undefined ? b.genero   : c.genero,
        b.paginas  !== undefined ? b.paginas  : c.numero_paginas,
        b.sinopse  !== undefined ? b.sinopse  : c.sinopse,
        b.capa     !== undefined ? b.capa     : c.capa_url,
        b.status   !== undefined ? b.status   : (c.status || "disponivel"),
        b.isbn     !== undefined ? b.isbn     : c.isbn,
        id,
      ]
    );

    res.json({
      message: "Livro atualizado com sucesso!",
      book: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar livro", details: err.message });
  }
});

router.delete("/:id", async function (req, res) {
  try {
    var id = parseInt(req.params.id, 10);

    var result = await pool.query(
      `DELETE FROM livro WHERE id_livro = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Livro não encontrado." });
    }

    res.json({
      message: "Livro deletado com sucesso!",
      book: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao deletar livro", details: err.message });
  }
});

module.exports = router;