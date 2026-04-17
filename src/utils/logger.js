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
          // Reemplaza saltos de línea y caracteres de control comunes en inyecciones de logs
          return arg.replaceAll(/[\r\n\t\f]/g, '').replaceAll(/[^\x20-\x7E]/g, '?');
        }
        if (arg && typeof arg === 'object') {
          // Para objetos, podemos serializarlos brevemente y aplicar la misma sanitización
          try {
            const str = JSON.stringify(arg);
            return str.replaceAll(/[\r\n\t\f]/g, '').replaceAll(/[^\x20-\x7E]/g, '?');
          } catch (e) {
            return `[Objeto no serializable: ${e.message}]`;
          }
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
