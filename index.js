const csrf = require('csurf');
const winston = require('winston');
const cookieParser = require('cookie-parser');
const https = require('https');
const fs = require('fs');
const { createServer } = require('http');
const firebaseAdmin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const expressWinston = require('express-winston');
const serviceAccount = require('./firebase-admin.json');

const port = process.env.PORT || 3000;

const server = express();

server.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json(),
    ),
    meta: true,
    msg: 'HTTP {{req.method}} {{req.url}}',
    expressFormat: true,
    colorize: false,
    ignoreRoute() {
      return false;
    },
  }),
);

server.use(cookieParser());
server.use(bodyParser.json());

const csrfProtection = csrf({ cookie: true });

const { format } = winston;

const logger = winston.createLogger({
  level: 'info',
  format: format.combine(format.splat(), format.json()),
  defaultMeta: { service: 'user-service' },
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

const session = (req, res) => {
  // https://firebase.google.com/docs/auth/admin/manage-cookies
  // Get the ID token passed and the CSRF token.
  const idToken = req.body.idToken.toString();

  // Set session expiration to 5 days.
  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  // Create the session cookie. This will also verify the ID token in the
  // process.  The session cookie will have the same claims as the ID token.
  // To only allow session cookie setting on recent sign-in, auth_time in ID
  // token can be checked to ensure user was recently signed in before creating
  // a session cookie.
  firebaseAdmin
    .auth()
    .createSessionCookie(idToken, { expiresIn })
    .then(
      (sessionCookie) => {
        // Set cookie policy for session cookie.
        const options = { maxAge: expiresIn, httpOnly: true, secure: true };
        res.cookie('session', sessionCookie, options);
        res.end(JSON.stringify({ status: 'success' }));
      },
      (error) => {
        logger.log('error', 'Could not create session cookie: %o', error);
        res.status(401).send('UNAUTHORIZED REQUEST!');
      },
    )
    .catch((error) => logger.log('error', error));
};

const verify = (req, res) => {
  const sessionCookie = req.cookies.session;

  firebaseAdmin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then(() => {
      res.json({ success: true });
    })
    .catch(() => {
      // Session cookie is unavailable or invalid. Force user to login.
      res.status(401).send('UNAUTHORIZED REQUEST!');
    });
};

server.get('*', csrfProtection, (req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken());
  next();
});

server.post('/api/session', csrfProtection, session);
server.post('/api/verify', csrfProtection, verify);

if (process.env.NODE_ENV === 'development') {
  const httpsOptions = {
    key: fs.readFileSync('./certs/localhost-key.pem'),
    cert: fs.readFileSync('./certs/localhost.pem'),
  };

  https.createServer(httpsOptions, server).listen(port, (err) => {
    if (err) throw err;
    logger.log('info', `> Ready on https://localhost:${port}`);
  });
} else {
  createServer(server).listen(port, (err) => {
    if (err) throw err;
    logger.log('info', `> Ready on http://localhost:${port}`);
  });
}
