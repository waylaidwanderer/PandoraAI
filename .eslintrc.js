module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: [
        'plugin:vue/vue3-essential',
        'airbnb-base',
    ],
    overrides: [],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    plugins: [
        'vue',
    ],
    rules: {
        'vue/multi-word-component-names': ['error', {
            ignores: ['Chat'],
        }],
        'import/no-unresolved': 'off',
        indent: ['error', 4, { SwitchCase: 1 }],
        'max-len': [
            'error', {
                code: 150,
                ignoreStrings: true,
                ignoreTemplateLiterals: true,
                ignoreComments: true,
            },
        ],
        'linebreak-style': 0,
        'arrow-parens': [2, 'as-needed', { requireForBlockBody: true }],
        'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
        'no-console': 'off',
        'import/extensions': 'off',
        'no-use-before-define': [
            'error', {
                functions: false,
            },
        ],
        'no-promise-executor-return': 'off',
        'no-param-reassign': 'off',
        'no-continue': 'off',
        'no-restricted-syntax': 'off',
        'no-undef': 'off',
        'import/prefer-default-export': 'off',
    },
};
