<script setup>
import { storeToRefs } from 'pinia';
import GPTIcon from '~/components/Icons/GPTIcon.vue';
import BingIcon from '~/components/Icons/BingIcon.vue';
import { usePresetsStore } from '~/stores/presets';

defineProps({
    presetName: {
        type: String,
        required: true,
    },
    setClientToUse: {
        type: Function,
        required: true,
    },
    setIsClientSettingsModalOpen: {
        type: Function,
        required: true,
    },
});

const presetsStore = usePresetsStore();
const { presets } = storeToRefs(presetsStore);
const customPresets = computed(() => presets.value.filter(preset => !['OpenAI API', 'ChatGPT', 'Bing'].includes(preset.name)));

const importAppData = () => {
    // get JSON file from user and turn it into localStorage
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = (readerEvent) => {
            const content = readerEvent.target.result;
            localStorage.clear();
            Object.assign(localStorage, JSON.parse(content));
            window.location.reload();
        };
    };
    input.click();
};

const exportAppData = () => {
    // turn localStorage into JSON and save it as a file
    const dataStr = JSON.stringify(localStorage);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = 'appData.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
};
</script>

<template>
    <div
        class="flex flex-col absolute bottom-full w-full overflow-hidden"
    >
        <div class="flex items-center justify-end gap-2 shadow-sm bg-white/[15%] text-sm backdrop-blur rounded-t py-1 px-3">
            <button
                @click="importAppData"
                class="flex items-center gap-1 text-white/60 transition duration-300 hover:text-white/80"
            >
                <Icon class="w-4 h-4" name="bx:bx-import" />
                Import
            </button>
            <button
                @click="exportAppData"
                class="flex items-center gap-1 text-white/60 transition duration-300 hover:text-white/80"
            >
                <Icon class="w-4 h-4" name="bx:bx-export" />
                Export
            </button>
        </div>
        <div class="flex flex-col items-stretch bg-white/10 backdrop-blur-sm overflow-auto max-h-[160px]">
            <div class="w-full flex flex-row">
                <button
                    class="px-3 py-1 flex-1 flex flex-row items-center transition ease-in-out hover:bg-white/20 text-sm"
                    :class="{ 'font-bold': presetName === 'chatgpt' }"
                    @click="setClientToUse('chatgpt')"
                >
                    <GPTIcon class="h-9 py-2 pr-2 rounded-lg" />
                    OpenAI API
                </button>
                <button
                    class="hover:bg-white/20 px-3 py-1 flex items-center transition ease-in-out"
                    @click="setIsClientSettingsModalOpen(true, 'chatgpt')"
                >
                    <Icon class="w-5 h-5 text-white/70" name="bx:bxs-cog" />
                </button>
            </div>
            <div class="w-full flex flex-row">
                <button
                    class="w-full px-3 py-1 flex flex-row items-center transition ease-in-out hover:bg-white/20 border-t border-white/5 text-sm"
                    :class="{ 'font-bold': presetName === 'chatgpt-browser' }"
                    @click="setClientToUse('chatgpt-browser')"
                >
                    <GPTIcon class="h-9 py-2 pr-2 text-[#6ea194] rounded-lg" />
                    ChatGPT
                </button>
                <button
                    class="hover:bg-white/20 px-3 py-1 flex items-center transition ease-in-out border-t border-white/5"
                    @click="setIsClientSettingsModalOpen(true, 'chatgpt-browser')"
                >
                    <Icon class="w-5 h-5 text-white/70" name="bx:bxs-cog" />
                </button>
            </div>
            <div class="w-full flex flex-row">
                <button
                    class="w-full px-3 py-1 flex flex-row items-center transition ease-in-out hover:bg-white/20 text-sm border-t border-white/5"
                    :class="{ 'font-bold': presetName === 'bing' }"
                    @click="setClientToUse('bing')"
                >
                    <BingIcon class="h-9 py-2 pr-2 rounded-lg" />
                    Bing
                </button>
                <button
                    class="hover:bg-white/20 px-3 py-1 flex items-center transition ease-in-out border-t border-white/5"
                    @click="setIsClientSettingsModalOpen(true, 'bing')"
                >
                    <Icon class="w-5 h-5 text-white/70" name="bx:bxs-cog" />
                </button>
            </div>
            <div
                v-for="preset in customPresets"
                :key="preset.name"
                class="w-full flex flex-row"
            >
                <button
                    class="w-full px-3 py-1 flex flex-row items-center transition ease-in-out hover:bg-white/20 text-sm border-t border-white/5"
                    :class="{ 'font-bold': presetName === preset.name }"
                    @click="setClientToUse(preset.name)"
                >
                    <GPTIcon
                        v-if="preset.client === 'chatgpt'"
                        class="h-9 py-2 pr-2 rounded-lg"
                    />
                    <GPTIcon
                        v-else-if="preset.client === 'chatgpt-browser'"
                        class="h-9 py-2 pr-2 text-[#6ea194] rounded-lg"
                    />
                    <BingIcon
                        v-else-if="preset.client === 'bing'"
                        class="h-9 py-2 pr-2 rounded-lg"
                    />
                    {{ preset.name }}
                </button>
                <button
                    class="hover:bg-white/20 px-3 py-1 flex items-center transition ease-in-out border-t border-white/5"
                    @click="setIsClientSettingsModalOpen(true, preset.client, preset.name)"
                >
                    <Icon class="w-5 h-5 text-white/70" name="bx:bxs-cog" />
                </button>
            </div>
        </div>
    </div>
</template>
