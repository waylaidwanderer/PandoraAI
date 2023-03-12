<script setup>
import { storeToRefs } from 'pinia';
import { useAppStore } from '~/stores/app';

const appStore = useAppStore();

const {
    isMenuOpen,
    isMenuOpening,
    isMenuClosing,
} = storeToRefs(appStore);
</script>

<template>
    <div
        class="
            flex flex-col bg-purple-300/10 flex-1 max-w-xs shadow-lg
            absolute top-0 left-0 h-screen z-50 w-full
            backdrop-blur-lg
            transition-all duration-300 ease-in-out
        "
        :class="{
            'translate-x-0 absolute lg:static': isMenuOpen,
            '!absolute': isMenuOpening,
            '-translate-x-full': !isMenuOpen,
        }"
    >
        <!-- close button -->
        <Transition name="fade">
            <div
                v-if="isMenuOpen || isMenuClosing"
                class="absolute top-0 -right-8 bottom-0 flex items-center lg:hidden"
            >
                <button
                    @click="isMenuOpen = false"
                    class="
                    bg-purple-300/10 rounded-r backdrop-blur-lg
                    text-white/50 hover:text-white/80
                    focus:outline-none z-10
                    transition duration-300 ease-in-out
                "
                >
                    <Icon name="bx:bx-chevron-left" class="w-8 h-8"/>
                </button>
            </div>
        </Transition>
        <!-- Chat threads -->
        <div class="flex-1 p-3">
            <!-- New Chat -->
            <button
                class="
                    flex flex-row items-center w-full bg-white/5 rounded-lg shadow p-3 mb-3
                    transition duration-300 ease-in-out
                    hover:bg-white/10
                "
            >
                    <span class="flex flex-col flex-1 text-left">
                        <span class="text-sm font-bold text-white/80">New Chat</span>
                        <span class="text-xs text-white/60">Click to start a new chat</span>
                    </span>
                <Icon name="bx:bx-plus" class="w-8 h-8"/>
            </button>
        </div>
        <!-- Sidebar footer -->
        <div class="flex gap-2 bg-black/5 px-3 py-6">
            <div class="flex gap-3 items-center justify-center w-full">
                <AppData/>
            </div>
        </div>
    </div>
</template>

<style>
:root {
    --background: hsl(240, 80%, 10%);
}

body {
    background: radial-gradient(
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
        hsla(240, 100%, 60%, 0) 95%) var(--background);
}

footer a {
    @apply opacity-75 hover:opacity-100 transition duration-300 ease-in-out;
    background: linear-gradient(to right, #37feff 0%, #bd7bff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.fork-corner.fc-theme-github + div {
    @apply shadow bg-black/50 z-40;
}

.fork-corner.fc-theme-github > i {
    @apply text-white/80;
}

</style>
