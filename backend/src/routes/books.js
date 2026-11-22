var express = require('express');
var router = express.Router();
const bookControler = require('../controllers/bookController');
const avaliacaoController = require('../controllers/avaliacaoController');
const favoritoController = require('../controllers/favoritoController');
const authenticateToken = require('../middlewares/auth');
const requireBibliotecario = require('../middlewares/auth').requireBibliotecario;

// Rota de renovação de empréstimo (Leitor)
// IMPORTANTE: declarada antes de /:id para evitar conflito com GET /:id

const multer = require('multer');
const path = require('path');

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/covers');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + ext);
  }
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
    err.message = 'Formato de imagem inválido. Use PNG, JPG ou JPEG.';
    return cb(err, false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

/** Trata erros do multer de forma centralizada */
function handleUpload(field) {
  return (req, res, next) => {
    upload.single(field)(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        const msg =
          err.code === 'LIMIT_FILE_SIZE'
            ? 'Arquivo muito grande. O limite é 5 MB.'
            : err.message || 'Erro no envio do arquivo.';
        return res.status(400).json({ error: msg });
      }
      next(err);
    });
  };
}

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

// histórico de leituras (empréstimos devolvidos)
router.get('/historico-leituras', authenticateToken, bookControler.getHistoricoLeituras);

// favoritos (precisa vir antes de /:id)
router.get('/favoritos', authenticateToken, favoritoController.listarFavoritos);

// renovar empréstimo (Leitor) — precisa vir antes de /:id
router.post('/emprestimos/:id/renovar', authenticateToken, bookControler.renovarEmprestimo);

// avaliações (rotas específicas antes de /:id genérico onde aplicável)
router.get('/:id/avaliacoes', avaliacaoController.listarAvaliacoes);
router.get('/:id/avaliacoes/minha', authenticateToken, avaliacaoController.getMinhaAvaliacao);
router.post('/:id/avaliacoes', authenticateToken, avaliacaoController.salvarAvaliacao);
router.delete('/:id/avaliacoes/minha', authenticateToken, avaliacaoController.excluirMinhaAvaliacao);

// favoritar livro
router.get('/:id/favorito', authenticateToken, favoritoController.verificarFavorito);
router.post('/:id/favoritar', authenticateToken, favoritoController.adicionarFavorito);
router.delete('/:id/favoritar', authenticateToken, favoritoController.removerFavorito);

// get específico
router.get('/:id', bookControler.getBookId);


// ROTAS PRIVADAS (bibliotecário + sessão)
// cadastrar livro
router.post(
  '/cadastrar',
  authenticateToken,
  requireBibliotecario,
  handleUpload('capa'),
  bookControler.registerBook
);

// editar livro
router.put(
  '/editar/:id',
  authenticateToken,
  requireBibliotecario,
  handleUpload('capa'),
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