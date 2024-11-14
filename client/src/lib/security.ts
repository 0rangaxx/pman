import DOMPurify from 'dompurify';
import xss from 'xss';

// Sanitize HTML content
export function sanitizeHtml(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [], // Don't allow any HTML tags
    ALLOWED_ATTR: [], // Don't allow any HTML attributes
  });
}

// Sanitize text input
export function sanitizeInput(input: string): string {
  return xss(input, {
    whiteList: {}, // Don't allow any tags
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'xml'],
  });
}

// Sanitize metadata object
export function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(metadata)) {
    const sanitizedKey = sanitizeInput(String(key));
    const sanitizedValue = typeof value === 'string' 
      ? sanitizeInput(value)
      : typeof value === 'object' && value !== null
      ? sanitizeMetadata(value)
      : value;
    sanitized[sanitizedKey] = sanitizedValue;
  }
  return sanitized;
}

// Sanitize array of tags
export function sanitizeTags(tags: string[]): string[] {
  return tags.map(tag => sanitizeInput(tag));
}

// Validate input length
export function validateInputLength(input: string, maxLength: number = 1000): boolean {
  return input.length <= maxLength;
}

// Escape regex special characters
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
