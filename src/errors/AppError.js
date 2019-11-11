class AppError extends Error {
  constructor(...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }

    this.name = 'AppError';

    this.date = new Date();
  }
}

module.exports = AppError;
