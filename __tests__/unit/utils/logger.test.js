import { jest } from '@jest/globals';
import { logger } from '../../../src/utils/logger.js';

describe('Logger Utility', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    logger.setLevel('info');
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log error messages', () => {
    logger.error('This is an error');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toMatch(/\[.*\] \[ERROR\]/);
    expect(consoleSpy.mock.calls[0][1]).toBe('This is an error');
  });

  it('should log warn messages', () => {
    logger.warn('This is a warning');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toMatch(/\[.*\] \[WARN\]/);
    expect(consoleSpy.mock.calls[0][1]).toBe('This is a warning');
  });

  it('should log info messages', () => {
    logger.info('This is info');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toMatch(/\[.*\] \[INFO\]/);
    expect(consoleSpy.mock.calls[0][1]).toBe('This is info');
  });

  it('should not log debug messages by default (level info)', () => {
    logger.debug('This is debug');
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should log debug messages when level is set to debug', () => {
    logger.setLevel('debug');
    logger.debug('This is debug');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toMatch(/\[.*\] \[DEBUG\]/);
    expect(consoleSpy.mock.calls[0][1]).toBe('This is debug');
  });

  it('should not change level if invalid level is provided', () => {
    logger.setLevel('invalid_level');
    expect(logger.currentLevel).toBe(logger.levels.info);
  });

  it('should handle multiple arguments', () => {
    logger.info('Message', { key: 'value' }, 123);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][1]).toBe('Message');
    expect(consoleSpy.mock.calls[0][2]).toEqual('{"key":"value"}');
    expect(consoleSpy.mock.calls[0][3]).toBe('123'); // Ahora aseguramos que se transforman a strings seguros
  });
});
