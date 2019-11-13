const firebaseAdmin = require('firebase-admin');
const NotAuthorizedError = require('../../errors/NotAuthorizedError');

const verifyCookieMiddleware = (req, res, next) => {
  const sessionCookie = req.cookies.session;

  firebaseAdmin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then(() => {
      res.json({ success: true });
    })
    .catch(() => {
      const err = new NotAuthorizedError('Could not verify token');
      next(err);
    });
};

module.exports = verifyCookieMiddleware;
