import antfu from '@antfu/eslint-config'
import prettier from 'eslint-config-prettier/flat'

export default antfu(
  {
    typescript: {
      tsconfigPath: 'tsconfig.json',
    },
    stylistic: false,
    markdown: false,
    rules: {
      'antfu/if-newline': 'off',
      'ts/no-floating-promises': 'off',
      'ts/no-misused-promises': 'off',
      'eslint-comments/no-unlimited-disable': 'off',
      'no-console': 'off',
    },
  },
  {
    ignores: ['**/fixtures/**/*'],
  },
  {
    files: ['**/*.{test,spec}.ts'],
    rules: {
      'no-console': 'off',
      'ts/no-unsafe-assignment': 'off',
      'ts/no-unsafe-member-access': 'off',
    },
  },
  prettier,
)
