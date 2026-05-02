var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();

var indexRouter = require('./src/routes/index');
var usersRouter = require('./src/routes/users');
var booksRouter = require('./src/routes/books');

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
