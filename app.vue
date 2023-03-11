<script setup>
// eslint-disable-next-line import/no-extraneous-dependencies
import 'fork-corner/dist/fork-corner.css';
import initForkCorner from '~/fork-corner';

useHead({
    meta: [
        {
            name: 'viewport',
            content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
        },
    ],
});

onMounted(() => {
    initForkCorner();
});
</script>

<template>
    <a
        href="https://github.com/waylaidwanderer/chatgpt-web-client"
        target="_blank"
        id="fork-corner"
        class="fork-corner fc-size-small fc-pos-tr fc-animate fc-theme-github"
        title="Fork me on GitHub"
    ></a>
    <div class="flex flex-col min-h-screen text-slate-300">
        <header class="px-3 py-6 text-center">
            <h1 class="text-3xl font-black text-white/80 drop-shadow-md">ChatGPT Web Client</h1>
        </header>
        <main class="flex flex-grow py-2">
            <Chat/>
        </main>
        <footer class="px-3 py-6 text-center">
            <span class="text-xs font-light text-slate-400">
                powered by
                <a href="https://github.com/waylaidwanderer/node-chatgpt-api" target="_blank">
                    https://github.com/waylaidwanderer/node-chatgpt-api
                </a>
            </span>
        </footer>
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

.fork-corner.fc-theme-github + div {
    @apply shadow bg-black/50;
}

.fork-corner.fc-theme-github > i {
    @apply text-white/80;
}
</style>
