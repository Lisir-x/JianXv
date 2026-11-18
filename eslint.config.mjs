import js from '@eslint/js'
import ts from 'typescript-eslint'
export default ts.config({ignores:['**/*.cjs']},js.configs.recommended, ...ts.configs.recommended, {
  files: ['**/*.{ts,tsx,mjs}'],
  languageOptions: { globals: { console:'readonly',window:'readonly',document:'readonly',HTMLElement:'readonly',setInterval:'readonly',clearInterval:'readonly',setTimeout:'readonly',process:'readonly',Buffer:'readonly',FormData:'readonly',HTMLDialogElement:'readonly',HTMLInputElement:'readonly' } },
  rules: { '@typescript-eslint/no-explicit-any':'off', '@typescript-eslint/no-unused-vars':['error',{argsIgnorePattern:'^_',varsIgnorePattern:'^_'}] }
})
