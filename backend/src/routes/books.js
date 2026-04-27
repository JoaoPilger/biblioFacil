var express = require("express");
var fs = require("fs");
var path = require("path");

var router = express.Router();

var DATA_PATH = path.join(__dirname, "..", "data", "books.json");

function safeReadBooks() {
  try {
    var raw = fs.readFileSync(DATA_PATH, "utf8");
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function normalize(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

function pickRandom(list) {
  if (!list || list.length === 0) return null;
  var idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

// GET /api/books?genero=Aventura&limit=6
router.get("/", function (req, res) {
  var genero = req.query.genero;
  var limit = parseInt(req.query.limit, 10);
  if (isNaN(limit) || limit <= 0) limit = 50;

  var books = safeReadBooks();
  if (genero) {
    var g = normalize(genero);
    books = books.filter(function (b) {
      return normalize(b.genero) === g;
    });
  }

  res.json({
    items: books.slice(0, limit),
    total: books.length,
  });
});

// GET /api/books/random?genero=Aventura
router.get("/random", function (req, res) {
  var genero = req.query.genero;
  var books = safeReadBooks();

  if (genero) {
    var g = normalize(genero);
    books = books.filter(function (b) {
      return normalize(b.genero) === g;
    });
  }

  var book = pickRandom(books);
  if (!book) {
    return res.status(404).json({ error: "Nenhum livro encontrado." });
  }

  return res.json({ item: book });
});

// GET /api/books/:id - Obter um livro específico
router.get("/:id", function (req, res) {
  try {
    var id = parseInt(req.params.id, 10);
    var books = safeReadBooks();
    var book = books.find(function (b) {
      return b.id === id;
    });

    if (!book) {
      return res.status(404).json({ error: "Livro não encontrado." });
    }

    res.json({ item: book });
  } catch (err) {
    res.status(500).json({
      error: "Erro ao buscar livro",
      details: err.message
    });
  }
});

// POST /api/books - Adicionar novo livro
router.post("/", function (req, res) {
  try {
    var books = safeReadBooks();
    var newBook = {
      id: books.length > 0 ? Math.max(...books.map(b => b.id || 0)) + 1 : 1,
      titulo: req.body.titulo || "",
      autor: req.body.autor || "",
      ano: req.body.ano || "",
      edicao: req.body.edicao || "",
      editora: req.body.editora || "",
      genero: req.body.genero || "",
      paginas: req.body.paginas || "",
      sinopse: req.body.sinopse || "",
      capa: req.body.capa || null,
      dataCriacao: new Date().toISOString()
    };

    books.push(newBook);
    fs.writeFileSync(DATA_PATH, JSON.stringify(books, null, 2));

    res.status(201).json({
      message: "Livro adicionado com sucesso!",
      book: newBook
    });
  } catch (err) {
    res.status(500).json({
      error: "Erro ao adicionar livro",
      details: err.message
    });
  }
});

// PUT /api/books/:id - Atualizar livro
router.put("/:id", function (req, res) {
  try {
    var id = parseInt(req.params.id, 10);
    var books = safeReadBooks();
    var bookIndex = books.findIndex(function (b) {
      return b.id === id;
    });

    if (bookIndex === -1) {
      return res.status(404).json({ error: "Livro não encontrado." });
    }

    var updatedBook = Object.assign({}, books[bookIndex], {
      titulo: req.body.titulo !== undefined ? req.body.titulo : books[bookIndex].titulo,
      autor: req.body.autor !== undefined ? req.body.autor : books[bookIndex].autor,
      ano: req.body.ano !== undefined ? req.body.ano : books[bookIndex].ano,
      edicao: req.body.edicao !== undefined ? req.body.edicao : books[bookIndex].edicao,
      editora: req.body.editora !== undefined ? req.body.editora : books[bookIndex].editora,
      genero: req.body.genero !== undefined ? req.body.genero : books[bookIndex].genero,
      paginas: req.body.paginas !== undefined ? req.body.paginas : books[bookIndex].paginas,
      sinopse: req.body.sinopse !== undefined ? req.body.sinopse : books[bookIndex].sinopse,
      capa: req.body.capa !== undefined ? req.body.capa : books[bookIndex].capa,
      status: req.body.status !== undefined ? req.body.status : (books[bookIndex].status || "disponivel")
    });

    books[bookIndex] = updatedBook;
    fs.writeFileSync(DATA_PATH, JSON.stringify(books, null, 2));

    res.json({
      message: "Livro atualizado com sucesso!",
      book: updatedBook
    });
  } catch (err) {
    res.status(500).json({
      error: "Erro ao atualizar livro",
      details: err.message
    });
  }
});

// DELETE /api/books/:id - Deletar livro
router.delete("/:id", function (req, res) {
  try {
    var id = parseInt(req.params.id, 10);
    var books = safeReadBooks();
    var bookIndex = books.findIndex(function (b) {
      return b.id === id;
    });

    if (bookIndex === -1) {
      return res.status(404).json({ error: "Livro não encontrado." });
    }

    var deletedBook = books.splice(bookIndex, 1)[0];
    fs.writeFileSync(DATA_PATH, JSON.stringify(books, null, 2));

    res.json({
      message: "Livro deletado com sucesso!",
      book: deletedBook
    });
  } catch (err) {
    res.status(500).json({
      error: "Erro ao deletar livro",
      details: err.message
    });
  }
});

module.exports = router;

