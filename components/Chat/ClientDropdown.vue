<script setup>
import { storeToRefs } from 'pinia';
import GPTIcon from '~/components/Icons/GPTIcon.vue';
import BingIcon from '~/components/Icons/BingIcon.vue';
import { usePresetsStore } from '~/stores/presets';

const props = defineProps({
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
    canChangePreset: {
        type: Boolean,
        required: true,
    },
});

const presetsStore = usePresetsStore();
const { presets } = storeToRefs(presetsStore);
const customPresets = computed(() => presets.value.filter(preset => !['OpenAI API', 'ChatGPT', 'Bing'].includes(preset.name)));

const setClientToUseHandler = (clientName) => {
    if (props.canChangePreset) {
        props.setClientToUse(clientName);
    }
};

const scrollToActivePreset = () => {
    const presetsDiv = document.querySelector('.presets');
    const activePreset = document.querySelector('.presets .active');
    if (presetsDiv && activePreset) {
        // check if active preset is out of view
        const presetsDivRect = presetsDiv.getBoundingClientRect();
        const activePresetRect = activePreset.getBoundingClientRect();
        const topDiff = activePresetRect.top - presetsDivRect.top;
        const bottomDiff = presetsDivRect.bottom - activePresetRect.bottom;
        const allowableDiff = 15;
        if (
            (topDiff < 0 && Math.abs(topDiff) > allowableDiff)
            || (bottomDiff < 0 && Math.abs(bottomDiff) > allowableDiff)
        ) {
            // scroll to active preset
            presetsDiv.scrollTop = activePreset.offsetTop - presetsDiv.offsetTop;
        }
    }
};

watch(() => props.presetName, () => {
    nextTick(() => {
        scrollToActivePreset();
    });
});

onMounted(() => {
    scrollToActivePreset();
});
</script>

<template>
    <div
        class="flex flex-col absolute bottom-full w-full overflow-hidden backdrop-blur"
    >
        <div class="flex items-center justify-start gap-2 shadow-sm bg-white/[15%] text-white/80 text-sm rounded-t py-1 px-3">
            Presets
        </div>
        <div class="presets flex flex-col items-stretch bg-white/10 overflow-auto max-h-[160px]">
            <div class="w-full flex flex-row">
                <button
                    class="px-3 py-1 flex-1 flex flex-row items-center transition ease-in-out text-sm"
                    :class="{
                        'font-bold active': presetName === 'chatgpt',
                        'hover:bg-white/20': canChangePreset,
                        'cursor-not-allowed': !canChangePreset,
                    }"
                    @click="setClientToUseHandler('chatgpt')"
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
                    class="w-full px-3 py-1 flex flex-row items-center transition ease-in-out border-t border-white/5 text-sm"
                    :class="{
                        'font-bold active': presetName === 'chatgpt-browser',
                        'hover:bg-white/20': canChangePreset,
                        'cursor-not-allowed': !canChangePreset,
                    }"
                    @click="setClientToUseHandler('chatgpt-browser')"
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
                    class="w-full px-3 py-1 flex flex-row items-center transition ease-in-out text-sm border-t border-white/5"
                    :class="{
                        'font-bold active': presetName === 'bing',
                        'hover:bg-white/20': canChangePreset,
                        'cursor-not-allowed': !canChangePreset,
                    }"
                    @click="setClientToUseHandler('bing')"
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
                    class="w-full px-3 py-1 flex flex-row items-center transition ease-in-out text-sm border-t border-white/5"
                    :class="{
                        'font-bold active': presetName === preset.name,
                        'hover:bg-white/20': canChangePreset,
                        'cursor-not-allowed': !canChangePreset,
                    }"
                    @click="setClientToUseHandler(preset.name)"
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
