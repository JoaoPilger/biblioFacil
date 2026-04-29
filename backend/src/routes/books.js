var express = require('express');
var router = express.Router();
const bookControler = require('../controllers/bookController');

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/covers'); // Teste com caminho relativo simples
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ROTAS COMUNS
// get geral
router.get('/', bookControler.getBooks);

// get específico
router.get('/:id', bookControler.getBookId);


// ROTAS PRIVADAS
// cadastrar livro
router.post('/cadastrar', upload.single('capa'), bookControler.registerBook);

// editar livro
router.put('/editar/:id', upload.single('capa'), bookControler.modificateBook);

// deletar livro
router.delete('/deletar/:id', bookControler.deleteBook);

module.exports = router;