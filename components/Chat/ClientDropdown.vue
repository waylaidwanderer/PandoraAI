<script setup>
import GPTIcon from '~/components/Icons/GPTIcon.vue';
import BingIcon from '~/components/Icons/BingIcon.vue';

defineProps({
    clientToUse: {
        type: String,
        required: true,
    },
    setClientToUse: {
        type: Function,
        required: true,
    },
});


</script>

<template>
    <div
        class="flex flex-col items-stretch absolute bottom-full bg-white/10 backdrop-blur-sm rounded-t w-full overflow-hidden"
    >
        <div class="w-full flex flex-row">
            <button
                class="px-3 py-1 flex-1 flex flex-row items-center transition ease-in-out hover:bg-white/20 text-sm"
                :class="{ 'font-bold': clientToUse === 'chatgpt' }"
                @click="setClientToUse('chatgpt')"
            >
                <GPTIcon class="h-9 py-2 pr-2 shadow rounded-lg" />
                OpenAI API
            </button>
            <button class="hover:bg-white/20 px-3 py-1 flex items-center transition ease-in-out">
                <Icon class="w-5 h-5 text-white/70" name="bx:bxs-cog" />
            </button>
        </div>
        <div class="w-full flex flex-row">
            <button
                class="w-full px-3 py-1 flex flex-row items-center transition ease-in-out hover:bg-white/20 border-t border-b border-white/5 text-sm"
                :class="{ 'font-bold': clientToUse === 'chatgpt-browser' }"
                @click="setClientToUse('chatgpt-browser')"
            >
                <GPTIcon class="h-9 py-2 pr-2 text-[#6ea194] shadow rounded-lg" />
                ChatGPT
            </button>
            <button class="hover:bg-white/20 px-3 py-1 flex items-center transition ease-in-out">
                <Icon class="w-5 h-5 text-white/70" name="bx:bxs-cog" />
            </button>
        </div>
        <div class="w-full flex flex-row">
            <button
                class="w-full px-3 py-1 flex flex-row items-center transition ease-in-out hover:bg-white/20 text-sm"
                :class="{ 'font-bold': clientToUse === 'bing' }"
                @click="setClientToUse('bing')"
            >
                <BingIcon class="h-9 py-2 pr-2 shadow rounded-lg" />
                Bing
            </button>
            <button
                class="hover:bg-white/20 px-3 py-1 flex items-center transition ease-in-out"
            >
                <Icon class="w-5 h-5 text-white/70" name="bx:bxs-cog" />
            </button>
        </div>
    </div>
</template>
