const winston = require('winston');

const { format } = winston;

const logger = winston.createLogger({
  level: 'info',
  format: format.combine(format.splat(), format.json()),
});

logger.add(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  }),
);

module.exports = logger;
