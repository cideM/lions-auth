const AppError = require('./AppError');

class NotAuthorizedError extends AppError {}

module.exports = NotAuthorizedError;
