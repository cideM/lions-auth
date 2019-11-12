const firebaseAdmin = require('firebase-admin');
const NotAuthorizedError = require('../errors/NotAuthorizedError');

const verify = (req, res) => {
  const sessionCookie = req.cookies.session;

  firebaseAdmin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then(() => {
      res.json({ success: true });
    })
    .catch(() => {
      throw new NotAuthorizedError('Could not verify token');
    });
};

module.exports = verify;
