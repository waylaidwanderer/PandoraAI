// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    ssr: false,
    runtimeConfig: {
        public: {
            apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
        },
    },
    imports: {
        dirs: ['stores'],
    },
    modules: [
        '@nuxtjs/tailwindcss',
        '@kevinmarrec/nuxt-pwa',
        'nuxt-icon',
        '@pinia/nuxt',
        '@vueuse/nuxt',
    ],
    css: [
        {
            src: '~/node_modules/highlight.js/styles/base16/dracula.css',
            lang: 'css',
        },
    ],
    pinia: {
        autoImports: ['defineStore', 'acceptHMRUpdate'],
    },
    pwa: {
        icon: {
            source: './public/icon.png',
            maskablePadding: 0,
        },
        meta: {
            name: 'PandoraAI',
            description: 'Multiple AI Web Chat Client',
            theme_color: '#7733ff',
            mobileAppIOS: true,
            nativeUI: true,
        },
        manifest: {
            name: 'PandoraAI',
            description: 'Multiple AI Web Chat Client',
            background_color: '#7733ff',
            lang: 'en',
            useWebmanifestExtension: false,
        },
    },
});
