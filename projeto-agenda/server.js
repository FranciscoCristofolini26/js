require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const routes = require('./routes');
const path = require('path');
const csrf = require('csurf');
const { middlewareGlobal, checkCsrfError, csrfMiddleware } = require('./src/middlewares/middleware');

// Configuração da conexão com o MongoDB
// Configuração da conexão com o MongoDB
mongoose.connect(process.env.CONNECTIONSTRING)
  .then(() => {
    console.log('Conectado ao MongoDB');
    app.emit('pronto');
  })
  .catch(e => {
    console.error('Erro ao conectar ao MongoDB:', e);
  });

// Configuração da sessão
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.CONNECTIONSTRING }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
    httpOnly: true
  }
}));




app.use(flash());
const helmet = require('helmet');

app.use(helmet());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'public')));

app.set('views', path.resolve(__dirname, 'src', 'views'));
app.set('view engine', 'ejs');

// Middleware CSRF
app.use(csrf());
app.use(middlewareGlobal);
app.use(checkCsrfError);
app.use(csrfMiddleware);

app.use(routes);

app.use(
  helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      styleSrc: ["'self'", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:"],
    },
    reportOnly: true, // Ativa o modo "report-only"
  })
);

app.post('/csp-report-endpoint', express.json(), (req, res) => {
  console.log('CSP Violation:', req.body);
  res.status(204).end(); // Responde sem conteúdo
});


app.on('pronto', () => {
  app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
    console.log('Acesse http://localhost:3000');
  });
});
