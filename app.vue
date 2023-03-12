<script setup>
// eslint-disable-next-line import/no-extraneous-dependencies
import 'fork-corner/dist/fork-corner.css';
import { storeToRefs } from 'pinia';
import initForkCorner from '~/fork-corner';
import AppSidebar from '~/components/AppSidebar.vue';
import { useAppStore } from '~/stores/app';

useHead({
    meta: [
        {
            name: 'viewport',
            content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
        },
    ],
});

const appStore = useAppStore();

const {
    isMenuOpen,
} = storeToRefs(appStore);

onMounted(() => {
    initForkCorner();
});
</script>

<template>
    <a
        href="https://github.com/waylaidwanderer/PandoraAI"
        target="_blank"
        id="fork-corner"
        class="fork-corner fc-size-small fc-pos-tr fc-animate fc-theme-github"
        title="Fork me on GitHub"
    ></a>
    <div class="flex flex-row min-h-screen text-slate-300">
        <AppSidebar/>
        <Transition name="fade">
            <div
                v-if="isMenuOpen"
                @click="isMenuOpen = false"
                class="fixed inset-0 bg-black/30 z-10" aria-hidden="true"
            />
        </Transition>
        <div class="flex flex-col flex-1">
            <header class="px-3 py-6 text-center bg-white/5 backdrop-blur shadow-inner">
                <!-- Menu icon -->
                <button
                    @click="isMenuOpen = true"
                    class="
                        absolute top-0 left-0 p-3 ml-3 mt-3 text-white/70 hover:text-white/90 z-10
                        focus:outline-none
                        transition duration-300 ease-in-out
                    "
                >
                    <Icon name="bx:bx-menu" class="w-8 h-8" />
                </button>
                <h1 class="text-2xl font-bold text-white/80 drop-shadow-md">Pandora<span class="font-light">AI</span></h1>
            </header>
            <main class="flex flex-grow py-2">
                <Chat/>
            </main>
            <footer class="px-3 pb-6 text-center">
                <span class="text-xs font-light text-slate-400">
                    powered by
                    <a href="https://github.com/waylaidwanderer/node-chatgpt-api" target="_blank">
                        https://github.com/waylaidwanderer/node-chatgpt-api
                    </a>
                </span>
            </footer>
        </div>
    </div>
</template>

<style>
:root {
    --background: hsl(240, 80%, 10%);
}

body {
    background:
        radial-gradient(
            60vmax 60vmax at 0% 0%,
            hsla(240, 100%, 2%, 0.9) 0%,
            hsla(240, 100%, 2%, 0) 95%),
        radial-gradient(
            80vmax 50vmax at 110% -10%,
            hsla(175, 100%, 60%, 0.9) 0%,
            hsla(200, 100%, 50%, 0.5) 50%,
            hsla(240, 100%, 50%, 0) 95%),
        radial-gradient(
            90vmax 50vmax at 50vmax 50vmax,
            hsla(260, 100%, 60%, 0.9) 0%,
            hsla(240, 100%, 60%, 0) 95%)
        var(--background);
}

footer a {
    @apply opacity-75 hover:opacity-100 transition duration-300 ease-in-out;
    background: linear-gradient(to right, #37feff 0%, #bd7bff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

#fork-corner {
    z-index: 41;
}

.fork-corner.fc-theme-github + div {
    @apply shadow bg-black/50 z-40;
}

.fork-corner.fc-theme-github > i {
    @apply text-white/80;
}

.slide-leave-active,
.slide-enter-active {
    transition: 0.3s;
}
.slide-enter {
    transform: translate(100%, 0);
}
.slide-leave-to {
    transform: translate(-100%, 0);
}
</style>
