const express = require('express');
const router = express.Router();
const authenticateToken = require("../middlewares/auth");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
