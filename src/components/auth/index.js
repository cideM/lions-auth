const firebaseAdmin = require('firebase-admin');
const express = require('express');
const csrf = require('csurf');
const NotAuthorizedError = require('../../errors/NotAuthorizedError');

const router = express.Router();

router.use(csrf({ cookie: true, ignoreMethods: ['POST'] }));

router.post('/session_cookie', (req, res, next) => {
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
    .then(sessionCookie => {
      // Set cookie policy for session cookie.
      const options = { maxAge: expiresIn, httpOnly: true, secure: true };
      res.cookie('session', sessionCookie, options);
      res.end(JSON.stringify({ status: 'success' }));
    })
    .catch(error => {
      const err = new NotAuthorizedError(
        `Could not authorize claims based on token: ${error.message}`
      );
      next(err);
    });
});

module.exports = router;
