import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended,
  // Ignores (actually recommended to be first in the whole config logic)
  {
    ignores: ['node_modules/', 'dist/', 'eslint.config.js'],
  },

  // Core logic
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: true,
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        React: 'readonly',
        JSX: 'readonly',
        NodeJS: 'readonly',
        fetch: 'readonly',
        process: 'readonly',
        performance: 'readonly',
        navigator: 'readonly',
        crypto: 'readonly',
        self: 'readonly',
        requestAnimationFrame: 'readonly',
        location: 'readonly',
        localStorage: 'readonly',
        Image: 'readonly',
        TrustedHTML: 'readonly',
        btoa: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      prettier: prettier,
      import: importPlugin,
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        node: {
          alias: {
            map: [
              ['@', './src'],
              ['@public', './public'],
            ],
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      // React rules
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-filename-extension': [
        1, // Warning
        {
          extensions: ['.js', '.ts', '.tsx'],
        },
      ],
      'react/no-find-dom-node': 0,
      'react/jsx-props-no-spreading': 'off',
      'react/require-default-props': 'off',
      'react/no-array-index-key': 'error',
      'react/no-danger': 'error',
      'react/jsx-no-useless-fragment': 'error',
      'react/no-unstable-nested-components': 'error',
      'react/destructuring-assignment': ['error', 'always'],
      'react/no-unused-prop-types': 'error',

      // TypeScript rules
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
      'no-useless-constructor': 'off',
      '@typescript-eslint/no-useless-constructor': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': 'error',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'off', // Think about turning this on eventually
      '@typescript-eslint/no-unsafe-member-access': 'off', // Think about turning this on eventually
      '@typescript-eslint/no-unsafe-call': 'off', // Think about turning this on eventually
      '@typescript-eslint/class-methods-use-this': [
        1, // Warning
        {
          ignoreOverrideMethods: true,
        },
      ],
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'no-public',
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'off',
      'require-await': 1, // Warning
      '@typescript-eslint/await-thenable': 'warn',
      '@typescript-eslint/prefer-promise-reject-errors': 'off',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        1,
        {
          allowExpressions: true,
        },
      ],

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error', // Checks rules of Hooks
      'react-hooks/exhaustive-deps': 'error', // Checks effect dependencies

      // Import rules
      'import/prefer-default-export': 'off',
      'import/extensions': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/no-unresolved': 'off',

      // JSX A11y rules
      'jsx-a11y/anchor-is-valid': [
        'error',
        {
          components: ['Link'],
          specialLink: ['to', 'hrefLeft', 'hrefRight'],
          aspects: ['noHref', 'invalidHref', 'preferButton'],
        },
      ],
      'jsx-a11y/no-noninteractive-tabindex': 'error',

      // General rules
      'no-plusplus': 'off',
      'no-param-reassign': ['error', { props: true }],
      'no-nested-ternary': 'error',
      'max-classes-per-file': ['error', 1],
      'no-underscore-dangle': ['error', { enforceInMethodNames: true }],
      'func-names': ['error', 'as-needed'],
      'no-await-in-loop': 'error',
      'no-promise-executor-return': 'error',
      camelcase: 'error',
      'no-restricted-globals': ['error', 'event', 'name', 'length', 'isNaN'],
      'prefer-destructuring': ['error', { array: false, object: true }],
      'prefer-const': 'error',
      'no-console': 'error',
      'no-alert': 'error',
      'no-cond-assign': ['error', 'always'],
      'no-loop-func': 'error',
      'no-bitwise': 'error',
      'no-continue': 'error',
      eqeqeq: 'error',
      'eol-last': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: ['@material-ui/*/*/*', '!@material-ui/core/test-utils/*'],
        },
      ],
      'no-restricted-syntax': [
        1, // Warning
        {
          selector: ":matches(PropertyDefinition, MethodDefinition)[accessibility='private']",
          message: 'Use # prefix for private instead',
        },
      ],

      // Prettier rules
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
    },
  },

  // Disable type-aware linting for JavaScript files
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Webpack config files
  {
    files: ['webpack.*.js'],
    languageOptions: {
      parser: '@babel/eslint-parser',
      parserOptions: {
        requireConfigFile: false,
        ecmaVersion: 2018,
      },
    },
  },
];
