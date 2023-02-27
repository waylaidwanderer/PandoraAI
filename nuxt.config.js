// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindTypography from '@tailwindcss/typography';
export default defineNuxtConfig({
    modules: [
        '@nuxtjs/tailwindcss',
        'nuxt-icon',
    ],
    css: [
        {
            src: '~/node_modules/highlight.js/styles/base16/dracula.css',
            lang: 'css',
        },
    ],
    runtimeConfig: {
        public: {
            apiBaseUrl: process.env.API_BASE_URL,
        },
    },
});
