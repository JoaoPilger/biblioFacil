var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/auth');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/cadastro', userController.registerUser);
router.post('/login', userController.authenticateUser);

router.get('/me', authenticateToken, (req, res) => {
  try {
    res.json({
      user: req.user 
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar dados do usuário." });
  }
});

module.exports = router;
