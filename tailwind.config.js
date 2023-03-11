/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [],
    plugins: [
        // eslint-disable-next-line global-require,import/no-extraneous-dependencies
        require('@tailwindcss/typography'),
    ],
    theme: {
        extend: {
            typography: ({ theme }) => ({
                chatgpt: {
                    css: {
                        '--tw-prose-body': theme('colors.slate[300]'),
                        '--tw-prose-headings': theme('colors.slate[100]'),
                        '--tw-prose-lead': theme('colors.slate[300]'),
                        '--tw-prose-links': theme('colors.slate[200]'),
                        '--tw-prose-bold': theme('colors.slate[100]'),
                        '--tw-prose-counters': theme('colors.slate[300] / 50%'),
                        '--tw-prose-bullets': theme('colors.slate[300] / 50%'),
                        '--tw-prose-hr': theme('colors.slate[300] / 50%'),
                        '--tw-prose-quotes': theme('colors.slate[100]'),
                        '--tw-prose-quote-borders': theme('colors.slate[300] / 50%'),
                        '--tw-prose-captions': theme('colors.slate[300] / 50%'),
                        '--tw-prose-code': theme('colors.white'),
                        '--tw-prose-pre-code': theme('colors.slate[300]'),
                        '--tw-prose-pre-bg': 'rgb(0 0 0 / 50%)',
                        '--tw-prose-th-borders': theme('colors.slate[300]'),
                        '--tw-prose-td-borders': theme('colors.slate[300] / 50%'),
                    },
                },
            }),
        },
    },
};
