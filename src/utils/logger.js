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
      
      // Sanitizar todos los argumentos para evitar Log Injection
      const safeArgs = args.map(arg => {
        let str;
        try {
          if (arg instanceof Error) {
            str = arg.stack || arg.message;
          } else if (typeof arg === 'object') {
            str = JSON.stringify(arg);
          } else {
            str = String(arg);
          }
        } catch (e) {
          str = `[Objeto no serializable: ${e.message}]`;
        }
        
        // Reemplaza saltos de línea y caracteres de control comunes
        return str ? str.replaceAll(/[\r\n]/g, '').replaceAll(/[^\x20-\x7E]/g, '?') : '';
      });

      console.log(prefix, ...safeArgs); // NOSONAR - La sanitización se realiza en el bloque superior
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
