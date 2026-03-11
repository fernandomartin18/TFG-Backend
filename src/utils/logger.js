/**
 * Logger simple para la aplicación
 */
class Logger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
    this.currentLevel = this.levels.info;
  }

  _log(level, ...args) {
    if (this.levels[level] <= this.currentLevel) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      
      // Sanitizar todos los argumentos que sean texto para evitar Log Injection
      const safeArgs = args.map(arg => {
        if (typeof arg === 'string') {
          return arg.replaceAll(/[\r\n]/g, ''); // Elimina saltos de línea
        }
        return arg;
      });

      console.log(prefix, ...safeArgs);
    }
  }

  error(...args) {
    this._log('error', ...args);
  }

  warn(...args) {
    this._log('warn', ...args);
  }

  info(...args) {
    this._log('info', ...args);
  }

  debug(...args) {
    this._log('debug', ...args);
  }

  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.currentLevel = this.levels[level];
    }
  }
}

export const logger = new Logger();
