const logger = {
  info: (message, ...args) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} [INFO] [backend] ${message}`, ...args);
  },
  warn: (message, ...args) => {
    const timestamp = new Date().toISOString();
    console.warn(`${timestamp} [WARN] [backend] ${message}`, ...args);
  },
  error: (message, ...args) => {
    const timestamp = new Date().toISOString();
    console.error(`${timestamp} [ERROR] [backend] ${message}`, ...args);
  },
  debug: (message, ...args) => {
    if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.debug(`${timestamp} [DEBUG] [backend] ${message}`, ...args);
    }
  }
};

module.exports = logger;
