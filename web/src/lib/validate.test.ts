import { describe, expect, it } from 'vitest';
import { hasErrors, httpUrl, imageProblem, minLength, positiveNumber, required } from './validate';

describe('validators', () => {
  it('required / minLength trim whitespace', () => {
    expect(required('  ', 'a name')).toBe('Enter a name.');
    expect(required('x', 'a name')).toBe('');
    expect(minLength('ab ', 3, 'package name')).toBe('Package name must be at least 3 characters.');
    expect(minLength('abc', 3, 'package name')).toBe('');
  });

  it('positiveNumber needs a real number of 1 or more', () => {
    for (const bad of ['', ' ', 'abc', '0', '-2', '0.5', 'NaN', 'Infinity']) expect(positiveNumber(bad, 'a price')).not.toBe('');
    for (const ok of ['1', '2.5', '3999']) expect(positiveNumber(ok, 'a price')).toBe('');
  });

  it('httpUrl accepts only http(s) links', () => {
    expect(httpUrl('https://cdn.example.com/v.mp4', 'a link')).toBe('');
    expect(httpUrl('http://example.com', 'a link')).toBe('');
    for (const bad of ['', 'javascript:alert(1)', 'data:text/html,<script>', 'ftp://x.y/z', 'file:///etc/passwd', 'example.com', 'not a url']) {
      expect(httpUrl(bad, 'a link')).not.toBe('');
    }
  });

  it('imageProblem allows JPEG/PNG up to 2 MB', () => {
    expect(imageProblem({ type: 'image/png', size: 100 })).toBe('');
    expect(imageProblem({ type: 'image/jpeg', size: 2 * 1024 * 1024 })).toBe('');
    expect(imageProblem({ type: 'image/gif', size: 100 })).toMatch(/JPEG and PNG/);
    expect(imageProblem({ type: 'image/svg+xml', size: 100 })).toMatch(/JPEG and PNG/); // SVG can carry script
    expect(imageProblem({ type: 'image/png', size: 2 * 1024 * 1024 + 1 })).toMatch(/2 MB/);
  });

  it('hasErrors ignores empty messages', () => {
    expect(hasErrors({ a: '', b: '' })).toBe(false);
    expect(hasErrors({ a: '', b: 'bad' })).toBe(true);
  });
});
