import { encode } from 'html-entities';

// For display-only, doesn't modify stored content
export function escapeForDisplay(content: string): string {
  return encode(content);
}

// For search and filtering
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Validate input length only
export function validateInputLength(input: string, maxLength: number = 1000): boolean {
  return input.length <= maxLength;
}