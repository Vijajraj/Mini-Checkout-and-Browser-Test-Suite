export default [
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'evidence/**',
      'docs/**',
    ],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        crypto: 'readonly',
        Uint8Array: 'readonly',
        Intl: 'readonly',
        console: 'readonly',
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      'no-console': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'semi': ['error', 'always'],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unreachable': 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
    },
  },
];
