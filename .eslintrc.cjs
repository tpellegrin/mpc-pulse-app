module.exports = {
  root: true,
  extends: [
    'plugin:react/jsx-runtime',
    'plugin:prettier/recommended',
    'plugin:react-hooks/recommended',
    'plugin:storybook/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2021,
  },
  ignorePatterns: [
    '!.*.js',
    '!.*.cjs',
    '!.storybook/preview.tsx',
    '!.storybook/main.ts',
    'package.json',
    'graphql.config.json',
    '*apollo-helpers.ts',
    'src/graphql/generated/*',
  ],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:prettier/recommended',
      ],
      plugins: ['@typescript-eslint'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
      // Rules for TypeScript files
      rules: {
        'react-hooks/exhaustive-deps': 'off',
        '@typescript-eslint/no-empty-object-type': [
          'error',
          { allowInterfaces: 'always' },
        ],
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        'import/no-unresolved': 'off',
        'jsx-a11y/anchor-is-valid': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-use-before-define': [2, { functions: false }],
        'no-param-reassign': [
          'error',
          {
            ignorePropertyModificationsFor: ['next', 'forwardedRef'],
            props: true,
          },
        ],
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['assets/icons', 'assets/icons/*'],
                message: 'Use <Icon /> component instead.',
              },
            ],
          },
        ],
        'no-underscore-dangle': 'off',
        'no-void': 'off',
        'no-warning-comments': 'warn',
        'react/jsx-key': [
          'warn',
          {
            checkFragmentShorthand: true,
          },
        ],
        'react/prop-types': 'off',
        'react/react-in-jsx-scope': 'off',
        'react/jsx-props-no-spreading': 'off',
        'react/jsx-curly-brace-presence': [
          'error',
          { props: 'never', children: 'never' },
        ],
        'import/no-default-export': 'error',
        'import/no-extraneous-dependencies': [
          'error',
          {
            devDependencies: [
              'src/**/stories.tsx',
              '**/__tests__/**',
              '**/*{.,_}{test,spec}.{ts, tsx}',
              'src/test-utils/**',
            ],
            peerDependencies: true,
          },
        ],
      },
      overrides: [
        {
          // Files which require a default export
          files: [
            '**/stories.*',
            'src/storybook/**/*.*',
            '.storybook/preview.tsx',
            '.storybook/main.ts',
            'vite-env.d.ts',
            'src/utils/__mocks__/svgTransform.ts',
          ],
          rules: {
            'import/no-anonymous-default-export': 'off',
            'import/no-default-export': 'off',
          },
        },
        {
          files: [
            'src/components/**/logic.ts',
            'src/components/**/logic.tsx',
            'src/containers/**/connect.ts',
            'src/containers/**/logic.ts',
            'src/containers/**/logic.tsx',
            'src/graphql/hooks/**/*.ts',
            'src/model/**/*.ts',
          ],
          rules: {
            '@typescript-eslint/explicit-module-boundary-types': 'off',
          },
        },
      ],
    },
    {
      files: ['.storybook/*.js'],
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020,
        ecmaFeatures: { jsx: true },
      },
    },
    {
      files: ['src/views/flow/Calculator/**/*.tsx'],
      rules: {
        // Forbid hard-coded UI text in Calculator feature; use i18n t() instead
        'react/jsx-no-literals': [
          'error',
          { noStrings: true, ignoreProps: true }
        ],
      },
    },
  ],
  // Rules for all files
  rules: {
    'no-console': 'warn',
    'no-debugger': 'warn',
    'prettier/prettier': 'warn',
    'react/jsx-uses-react': 'error',
    'object-shorthand': 'error',
    'react/self-closing-comp': [
      'error',
      {
        component: true,
        html: true,
      },
    ],
  },
};
