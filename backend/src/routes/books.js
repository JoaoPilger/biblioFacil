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

module.exports = router;

