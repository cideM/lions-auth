const firebaseAdmin = require('firebase-admin');

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

module.exports = verify;
