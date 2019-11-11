const winston = require('winston');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const expressWinston = require('express-winston');
const firebaseAdmin = require('firebase-admin');
const NotAuthorizedError = require('./errors/NotAuthorizedError');
const serviceAccount = require('../firebase-admin.json');
const verify = require('./routes/verify');
const session = require('./routes/session');

const port = process.env.PORT || 3001;

const server = express();

server.use(cors());

const requestLogger = expressWinston.logger({
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.json(),
  ),
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
});

const errorLogger = expressWinston.errorLogger({
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.json(),
  ),
});

server.use(requestLogger);

server.use(cookieParser());
server.use(bodyParser.json());

const { format } = winston;

const logger = winston.createLogger({
  level: 'info',
  format: format.combine(format.splat(), format.json()),
});

if (process.env.NODE_ENV === 'development') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: 'https://<DATABASE_NAME>.firebaseio.com',
});

const mapDomainErrorToHttpResponse = (err) => {
  if (err instanceof NotAuthorizedError) return 403;
  return 500;
};

server.post('/api/session', session);

server.post('/api/verify', verify);

server.use(errorLogger);

// eslint-disable-next-line
server.use((err, req, res, next) => {
  const code = mapDomainErrorToHttpResponse(err);

  res.status(code).send(err.message);
});

server.listen(port, (err) => {
  if (err) throw err;
  logger.log('info', `> Ready on http://localhost:${port}`);
});
