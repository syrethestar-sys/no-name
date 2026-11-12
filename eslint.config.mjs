import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import prettier from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  prettier, // turn off rules that fight with Prettier
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      eqeqeq: 'error',
      'no-console': ['warn', { allow: ['error'] }],
      'prefer-const': 'error',
    },
  },
  {
    // One-off CLI scripts print to the terminal on purpose.
    files: ['scripts/**'],
    rules: { 'no-console': 'off' },
  },
  {
    ignores: ['node_modules/**', '.next/**', '.agents/**', '.claude/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
