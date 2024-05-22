import antfu from '@antfu/eslint-config'

export default antfu(
  {
    stylistic: {
      semi: false,
    },
  },
  {
    rules: {
      'no-console': 'off',
    },
  },
)
