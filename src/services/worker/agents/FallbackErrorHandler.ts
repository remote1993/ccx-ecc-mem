/**
 * Error detection for retryable failures in the session runtime.
 */

import { FALLBACK_ERROR_PATTERNS } from './types.js';
import { logger } from '../../../utils/logger.js';

/**
 * Check if an error matches retryable session-runtime failure patterns.
 */
export function shouldFallbackToClaude(error: unknown): boolean {
  const message = getErrorMessage(error);

  return FALLBACK_ERROR_PATTERNS.some(pattern => message.includes(pattern));
}

/**
 * Extract error message from various error types
 */
function getErrorMessage(error: unknown): string {
  if (error === null || error === undefined) {
    return '';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }

  return String(error);
}

/**
 * Check if error is an AbortError (user cancelled)
 *
 * @param error - Error object to check
 * @returns true if this is an abort/cancellation error
 */
export function isAbortError(error: unknown): boolean {
  if (error === null || error === undefined) {
    return false;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }

  if (typeof error === 'object' && 'name' in error) {
    return (error as { name: unknown }).name === 'AbortError';
  }

  return false;
}
