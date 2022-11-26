module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir : __dirname,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint/eslint-plugin',
    'import',
  ],
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      node: {
        extensions: ['.ts', '.tsx'],
      },
      typescript: {
        alwaysTryTypes: true,
        project: 'tsconfig.json',
      },
      alias: {
        map: [['@/*', 'src/*']],
        extensions: ['.ts'],
      },
    },
  },
  ignorePatterns: ['.eslintrc.js', 'ws-adapter.adapter.ts'],
  overrides: [
    {
      files: ['test/**', '.*\\.spec\\.ts$'],
      plugins: ['jest'],
      rules: {
        // Выключаем правило unbound-method в тестах
        '@typescript-eslint/unbound-method': 'off',
        'jest/unbound-method': 'error',
      },
    },
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',

    '@typescript-eslint/require-await': 'off', // для использования .forRootAsync
    '@typescript-eslint/no-unsafe-return': 'off', // для дополнений
    '@typescript-eslint/no-unsafe-assignment': 'off', // тоже для дополнений
    '@typescript-eslint/ban-ts-comment': 'off', // на всякий случай лучше оставить

    'import/prefer-default-export': 'off',
    'max-len': ['error', { 'code': 120 }],
    'no-underscore-dangle': ['error', { 'allow': ['_id'] }], // разрешает использование нижнего подчеркивания для id, нужно для mongo
    'no-param-reassign': ['error', { 'props': false }], // разрешает мутацию пропсов объекта
    'class-methods-use-this': 'off', // разрешает создание методов без использования this, нужно для controllers & gateways

    'import/no-cycle': 'off', // разрешает циклический импорт, нужно для схем и их проекций
  },
};
