import { FlatCompat } from '@eslint/eslintrc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const compat = new FlatCompat({ baseDirectory: path.dirname(fileURLToPath(import.meta.url)) });

const config = [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Security and clean-code rules on top of the Next.js defaults.
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-console': ['error', { allow: ['error'] }],
      eqeqeq: ['error', 'always'],
      '@typescript-eslint/no-explicit-any': 'error',
      'react/no-danger': 'error',
      'react/jsx-no-target-blank': 'error',
    },
  },
];

export default config;
