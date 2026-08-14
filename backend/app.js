var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();

var indexRouter = require('./src/routes/index');
var usersRouter = require('./src/routes/users');
var booksRouter = require('./src/routes/books');
var reservasRouter = require("./src/routes/reservas");
var circulacaoRouter = require("./src/routes/circulacao");
var multaRouter = require("./src/routes/multa");

const { iniciarRotinaLimpeza } = require("./src/services/reservaCleanupService");
const { iniciarRotinaNotificacoes } = require("./src/services/notificationService");

// Inicia rotina em segundo plano para cancelar reservas expiradas (executa periodicamente)
iniciarRotinaLimpeza();

// Inicia rotina de alertas de vencimento por e-mail
iniciarRotinaNotificacoes();

var app = express();

const cors = require('cors');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', usersRouter);
app.use('/livros', booksRouter);
app.use('/circulacao', circulacaoRouter);
app.use('/multa', multaRouter);

// Fallback para o SPA: serve o index.html do frontend em rotas de navegação
// (ex.: refresh em /login, /livro/5) que não batem em nenhuma rota de API.
app.get(/^\/(?!users|auth|livros|circulacao|multa).*/, function (req, res, next) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'), function (err) {
    if (err) next();
  });
});

app.use(function(req, res, next) {
  next(createError(404));
});


app.use(function(err, req, res, next) {
  // Define o status do erro
  const status = err.status || 500;
  
  // Retorna JSON em vez de res.render('error')
  res.status(status).json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  });
});

module.exports = app;
