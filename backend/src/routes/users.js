var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/auth');
const db = require("../config/db");

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/cadastro', userController.registerUser);
router.post('/login', userController.authenticateUser);

router.get('/me', authenticateToken, (req, res) => {
  try {
    const userId = Number(req.userId);
    if (!userId) {
      return res.status(401).json({ error: "Token inválido." });
    }

    db.query(
      "SELECT id, nome, email, tipo, created_at FROM users WHERE id = $1 LIMIT 1",
      [userId]
    )
      .then((result) => {
        if (!result.rows.length) {
          return res.status(404).json({ error: "Usuário não encontrado." });
        }
        return res.json({ user: result.rows[0] });
      })
      .catch(() => {
        return res.status(500).json({ error: "Erro ao buscar dados do usuário." });
      });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar dados do usuário." });
  }
});

module.exports = router;
