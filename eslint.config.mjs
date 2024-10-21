// @ts-check
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import eslintReact from 'eslint-plugin-react';
import eslintTerrestris from '@terrestris/eslint-config-typescript';
import eslint from '@eslint/js';
import tsEslint from 'typescript-eslint';
import stylisticEslint from '@stylistic/eslint-plugin'

export default tsEslint.config({
  extends: [
    eslint.configs.recommended,
    ...tsEslint.configs.recommended,
    ...tsEslint.configs.stylistic,
    importPlugin.flatConfigs.recommended
  ],
  files: [
    '**/*.{ts,tsx}',
  ],
  ignores: [
    '**/test/setup.ts',
    '**/*.spec.{ts,tsx}',
    'coverage/**/*.{js,ts*}',
    'dist/**/*.{js,ts*}'
  ],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
    parserOptions: {
      project: true,
      tsconfigRootDir: import.meta.dirname
    }
  },
  plugins: {
    'react-hooks': reactHooks,
    '@stylistic': stylisticEslint,
    react: eslintReact
  },
  rules: {
    ...eslintTerrestris.rules,
    'no-unused-vars': 'error',
    'arrow-spacing': 'warn',
    'comma-spacing': 'warn',
    'comma-dangle': 'warn',
    'eol-last': 'warn',
    'no-multi-spaces': 'warn',
    'no-multiple-empty-lines': ['warn', {
      max: 1
    }],
    'object-property-newline': 'warn',
    'object-curly-newline': ['warn', {
      consistent: true,
      minProperties: 2
    }],
    'space-before-function-paren': ['warn', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always'
    }],
    ...reactHooks.configs.recommended.rules,
    'react/jsx-closing-tag-location': ['warn'],
    'react/jsx-closing-bracket-location': ['warn'],
    'react-hooks/rules-of-hooks': ['warn'],
    'react-hooks/exhaustive-deps': ['warn'],
    '@typescript-eslint/member-ordering': 'off',
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    'import/no-named-as-default': 'off',
    'import/no-unresolved': 'off',
    'import/named': 'off',
    'import/order': ['warn', {
      groups: [
        'builtin',
        'external',
        'parent',
        'sibling',
        'index',
        'object'
      ],
      pathGroups: [{
        pattern: 'react',
        group: 'external',
        position: 'before'
      }, {
        pattern: '@terrestris/**',
        group: 'external',
        position: 'after'
      }],
      pathGroupsExcludedImportTypes: ['react'],
      'newlines-between': 'always-and-inside-groups',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true
      }
    }]
  }
});
