var express = require('express');
var router = express.Router();
const bookControler = require('../controllers/bookController');
const authenticateToken = require('../middlewares/auth');
const requireBibliotecario = require('../middlewares/auth').requireBibliotecario;

// Rota de renovação de empréstimo (Leitor)
// IMPORTANTE: declarada antes de /:id para evitar conflito com GET /:id

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

// reserva (antes de /:id só para deixar explícito; POST não conflita com GET /:id)
router.post('/:id/reservar', authenticateToken, bookControler.reserveBook);
router.get('/:id/minha-reserva', authenticateToken, bookControler.getMinhaReserva);
router.post('/:id/reserva/cancelar', authenticateToken, bookControler.cancelarReserva);
router.get('/:id/meu-emprestimo', authenticateToken, bookControler.getMeuEmprestimo);

// lista as reservas/empréstimos do usuário logado (precisa vir antes de /:id)
router.get('/minhas-reservas', authenticateToken, bookControler.getMinhasReservas);

// renovar empréstimo (Leitor) — precisa vir antes de /:id
router.post('/emprestimos/:id/renovar', authenticateToken, bookControler.renovarEmprestimo);

// get específico
router.get('/:id', bookControler.getBookId);


// ROTAS PRIVADAS (bibliotecário + sessão)
// cadastrar livro
router.post(
  '/cadastrar',
  authenticateToken,
  requireBibliotecario,
  upload.single('capa'),
  bookControler.registerBook
);

// editar livro
router.put(
  '/editar/:id',
  authenticateToken,
  requireBibliotecario,
  upload.single('capa'),
  bookControler.modificateBook
);

// deletar livro
router.delete(
  '/deletar/:id',
  authenticateToken,
  requireBibliotecario,
  bookControler.deleteBook
);

module.exports = router;