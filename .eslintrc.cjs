module.exports = {
  root: true,
  env: { node: true, es2022: true },
  env: { node: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'scripts'],
  parser: '@typescript-eslint/parser',
};
  ignorePatterns: ['dist', '.eslintrc.cjs', 'scripts', 'src/db', 'node_modules'],
  parser: '@typescript-eslint/parser',
  plugins: [],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
  },
}
