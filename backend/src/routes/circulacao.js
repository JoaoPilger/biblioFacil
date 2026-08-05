const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/auth");
const requireBibliotecario = require("../middlewares/auth").requireBibliotecario;
const circulacaoController = require("../controllers/circulacaoController");

router.get("/retiradas", authenticateToken, requireBibliotecario, circulacaoController.listRetiradasPendentes);
router.post("/retiradas/:id/confirmar", authenticateToken, requireBibliotecario, circulacaoController.confirmarRetirada);

router.get("/devolucoes", authenticateToken, requireBibliotecario, circulacaoController.listDevolucoesPendentes);
router.post("/devolucoes/:id/confirmar", authenticateToken, requireBibliotecario, circulacaoController.confirmarDevolucao);

router.post("/limpar-expiradas", authenticateToken, requireBibliotecario, circulacaoController.executarLimpezaManual);

module.exports = router;
