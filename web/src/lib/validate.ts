/** Pure form checks, shared by the catalogue forms. Each returns an error message or '' when valid. */
export const required = (v: string, what: string): string => (v.trim() ? '' : `Enter ${what}.`);

export const minLength = (v: string, min: number, what: string): string =>
  v.trim().length >= min ? '' : `${what[0].toUpperCase()}${what.slice(1)} must be at least ${min} characters.`;

export const positiveNumber = (v: string, what: string): string =>
  v.trim() !== '' && Number.isFinite(Number(v)) && Number(v) >= 1 ? '' : `Enter ${what} of 1 or more.`;

/** Only http(s) links are accepted, which rules out javascript: and data: URLs. */
export function httpUrl(v: string, what: string): string {
  if (!v.trim()) return `Enter ${what}.`;
  try {
    const u = new URL(v.trim());
    return u.protocol === 'http:' || u.protocol === 'https:' ? '' : `${what[0].toUpperCase()}${what.slice(1)} must start with http:// or https://.`;
  } catch {
    return `${what[0].toUpperCase()}${what.slice(1)} is not a valid link.`;
  }
}

export const IMAGE_TYPES = ['image/jpeg', 'image/png'];
export const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export function imageProblem(file: { type: string; size: number }): string {
  if (!IMAGE_TYPES.includes(file.type)) return 'Only JPEG and PNG images are allowed.';
  if (file.size > IMAGE_MAX_BYTES) return 'The image must be 2 MB or smaller.';
  return '';
}

export const hasErrors = (errors: Record<string, string>): boolean => Object.values(errors).some(Boolean);
