module.exports = {
  extends: [require.resolve('@3846masa/configs/eslint'), 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  rules: {
    'import/order': "off",
    'no-undefined': 'off',
    'react/jsx-sort-props': [
      'error',
      {
        reservedFirst: true,
        shorthandFirst: true,
      },
    ],
    'react/jsx-uses-react': 'off',
    'react/prop-types': ['off'],
    'react/react-in-jsx-scope': 'off',
    'typescript-eslint/no-explicit-any': 'off'
  },
  settings: {
    react: {
      version: '18.2.0',
    },
  },
};
