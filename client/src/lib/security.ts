/**
 * Security utilities for input sanitization and validation
 */

/**
 * Sanitize user input to prevent XSS attacks
 * @param input The raw user input
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize an object's string properties recursively
 * @param obj The object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends object>(obj: T): T {
  const result = { ...obj };
  
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      (result as any)[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      (result as any)[key] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else if (value && typeof value === 'object') {
      (result as any)[key] = sanitizeObject(value);
    }
  }
  
  return result;
}
