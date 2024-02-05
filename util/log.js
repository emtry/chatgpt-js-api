const winston = require('winston');
const config = require("../config");

function createLogger() {
  const logger = winston.createLogger({
    level: config.loglevel,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} [${level.toUpperCase()}] - ${message}`;
      })
    ),
    transports: [
      new winston.transports.Console()
    ]
  });

  return logger;
}


const logger = createLogger();
module.exports = logger;