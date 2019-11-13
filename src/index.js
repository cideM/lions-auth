const cookieParser = require('cookie-parser');
// const csrf = require('csurf');
const express = require('express');
const bodyParser = require('body-parser');
const firebaseAdmin = require('firebase-admin');

const NotAuthorizedError = require('./errors/NotAuthorizedError');
const serviceAccount = require('../firebase-admin.json');
const requestLogger = require('./logging/requestLogger');
const errorLogger = require('./logging/errorLogger');
const devLogger = require('./logging/devLogger');

const auth = require('./components/auth');
// const verifyCookieMiddleware = require('./components/auth/verifyCookieMiddleware');

const port = process.env.PORT || 3001;

const server = express();

server.use(cookieParser());

server.use(bodyParser.json());

server.use(requestLogger);

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: 'https://<DATABASE_NAME>.firebaseio.com'
});

const mapDomainErrorToHttpResponse = err => {
  // csrf error https://github.com/expressjs/csurf#custom-error-handling
  if (err.code === 'EBADCSRFTOKEN') return 403;
  if (err instanceof NotAuthorizedError) return 403;
  return 500;
};

server.use(auth);

// server.use(verifyCookieMiddleware);

server.use(errorLogger);

// eslint-disable-next-line
server.use((err, req, res, next) => {
  const code = mapDomainErrorToHttpResponse(err);

  res.status(code).send(err.message);
});

server.listen(port, err => {
  if (err) throw err;
  devLogger.log('info', `> Ready on http://localhost:${port}`);
});
