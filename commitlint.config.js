export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'refactor', 'test', 'perf', 'chore', 'ci', 'build', 'style'],
    ],
    'header-max-length': [2, 'always', 72],
  },
}
