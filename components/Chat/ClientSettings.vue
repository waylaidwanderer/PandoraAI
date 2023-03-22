<script setup>
import {
    Dialog,
    DialogTitle,
    DialogDescription,
    DialogPanel,
    Switch,
} from '@headlessui/vue';
import get from 'lodash/get';
import set from 'lodash/set';
import unset from 'lodash/unset';
import BingIcon from '~/components/Icons/BingIcon.vue';
import GPTIcon from '~/components/Icons/GPTIcon.vue';

const props = defineProps({
    isOpen: {
        type: Boolean,
        required: true,
    },
    setIsOpen: {
        type: Function,
        required: true,
    },
    client: {
        type: String,
    },
    presetName: {
        type: String,
    },
});

const availableOptions = {
    chatgpt: {
        stream: {
            type: 'checkbox',
            label: 'Stream Responses',
            default: true,
        },
        shouldGenerateTitle: {
            type: 'checkbox',
            label: 'Automatically Generate Titles',
            default: true,
        },
        clientOptions: {
            type: 'nested',
            label: 'Client Options',
            properties: {
                openaiApiKey: {
                    type: 'text',
                    label: 'OpenAI API Key',
                },
                reverseProxyUrl: {
                    type: 'text',
                    label: 'Reverse Proxy URL',
                },
                maxContextTokens: {
                    type: 'number',
                    label: 'Max Context Tokens',
                    min: 1,
                },
                maxPromptTokens: {
                    type: 'number',
                    label: 'Max Prompt Tokens',
                    min: 1,
                },
                userLabel: {
                    type: 'text',
                    label: "User's Name",
                },
                chatGptLabel: {
                    type: 'text',
                    label: "AI's Name",
                },
                promptPrefix: {
                    type: 'textarea',
                    label: 'Instructions (Prompt Prefix)',
                },
                modelOptions: {
                    type: 'nested',
                    label: 'Model Options',
                    properties: {
                        model: {
                            type: 'text',
                            label: 'Model',
                        },
                        temperature: {
                            type: 'range',
                            label: 'Temperature',
                            min: 0,
                            max: 2,
                            step: 0.01,
                        },
                        top_p: {
                            type: 'range',
                            label: 'Top P',
                            min: 0,
                            max: 2,
                            step: 0.01,
                        },
                        presence_penalty: {
                            type: 'range',
                            label: 'Presence Penalty',
                            min: -2,
                            max: 2,
                            step: 0.01,
                        },
                        frequency_penalty: {
                            type: 'range',
                            label: 'Frequency Penalty',
                            min: -2,
                            max: 2,
                            step: 0.01,
                        },
                        max_tokens: {
                            type: 'range',
                            label: 'Max Tokens',
                            min: 1,
                            max: 4096,
                            step: 1,
                        },
                    },
                },
            },
        },
    },
    'chatgpt-browser': {
        stream: {
            type: 'checkbox',
            label: 'Stream Responses',
            default: true,
        },
        clientOptions: {
            type: 'nested',
            label: 'Client Options',
            properties: {
                reverseProxyUrl: {
                    type: 'text',
                    label: 'Reverse Proxy URL',
                },
                accessToken: {
                    type: 'textarea',
                    label: 'Access Token',
                },
                cookies: {
                    type: 'textarea',
                    label: 'Cookies',
                },
            },
        },
    },
    bing: {
        stream: {
            type: 'checkbox',
            label: 'Stream Responses',
            default: true,
        },
        jailbreakMode: {
            type: 'checkbox',
            label: 'Jailbreak Mode',
        },
        toneStyle: {
            type: 'select',
            label: 'Tone Style',
            options: [
                {
                    label: 'Creative',
                    value: 'creative',
                },
                {
                    label: 'Balanced',
                    value: 'balanced',
                },
                {
                    label: 'Precise',
                    value: 'precise',
                },
            ],
        },
        clientOptions: {
            type: 'nested',
            label: 'Client Options',
            properties: {
                host: {
                    type: 'text',
                    label: 'Host (e.g. https://cn.bing.com)',
                },
                cookies: {
                    type: 'textarea',
                    label: 'Cookies',
                },
            },
        },
    },
};

const presetStore = usePresetsStore();
const {
    setPreset,
    getPreset,
    deletePreset,
    setActivePresetName,
} = presetStore;

// computed default saveAsName based on client, using switch
const defaultSaveAsName = computed(() => {
    if (!props.client) {
        return '';
    }
    if (props.presetName !== props.client) {
        return props.presetName;
    }
    switch (props.client) {
        case 'chatgpt':
            return 'OpenAI API';
        case 'chatgpt-browser':
            return 'ChatGPT';
        case 'bing':
            return 'Bing';
        default:
            throw new Error('Invalid client');
    }
});

const saveAsName = ref(defaultSaveAsName.value);

const formClientOptions = ref({});

// Recursive form generation component
const generateForm = (options, parentKey, levels = 0) => Object.entries(options).map(([key]) => {
    const option = options[key];
    let optionKey;
    if (key === '0') {
        optionKey = parentKey;
    } else {
        optionKey = `${parentKey}.${key}`;
    }
    if (option.type === 'nested') {
        return h('div', { class: 'flex flex-col gap-2', style: `margin-left: ${levels}em;` }, [
            h('label', { class: 'text-white/80 font-bold' }, option.label),
            ...generateForm(option.properties, optionKey, levels + 1),
        ]);
    }
    // other types like text, range, checkbox etc.
    let classList = 'w-full placeholder-white/40 text-slate-300 text-sm rounded py-2 focus:outline-none';
    switch (option.type) {
        case 'range':
            classList = `${classList} bg-transparent`;
            break;
        default:
            classList = `${classList} shadow-inner bg-white/5 px-3`;
            break;
    }
    const inputValue = get(formClientOptions.value, optionKey, option.default);
    let inputElement;
    switch (option.type) {
        case 'textarea':
            inputElement = h('textarea', {
                placeholder: 'default server value',
                value: inputValue,
                onInput: (e) => {
                    const trimmedInputValue = e.target.value.trim();
                    if (!trimmedInputValue) {
                        unset(formClientOptions.value, optionKey);
                    } else {
                        set(formClientOptions.value, optionKey, trimmedInputValue);
                    }
                },
                class: classList,
            });
            break;
        case 'checkbox':
            inputElement = h(Switch, {
                modelValue: inputValue || false,
                'onUpdate:modelValue': (checked) => {
                    set(formClientOptions.value, optionKey, checked);
                },
                class: `relative inline-flex h-6 w-11 items-center rounded-full transition ${inputValue ? 'bg-white/50' : 'bg-white/10'}`,
            }, () => [
                h('span', { class: 'sr-only' }, option.label),
                h('span', {
                    class: `inline-block h-4 w-4 transform rounded-full bg-white transition ${inputValue ? 'translate-x-6' : 'translate-x-1'}`,
                }),
            ]);
            break;
        case 'select':
            inputElement = h('select', {
                value: inputValue,
                onChange: (e) => {
                    const targetValue = e.target.value;
                    if (!targetValue) {
                        unset(formClientOptions.value, optionKey);
                    } else {
                        set(formClientOptions.value, optionKey, targetValue);
                    }
                },
                class: classList,
            }, [
                h('option', { value: '' }, 'default server value'),
                ...option.options.map(_option => h('option', { value: _option.value }, _option.label)),
            ]);
            break;
        default:
            inputElement = h('input', {
                type: option.type,
                placeholder: 'default server value',
                value: inputValue,
                min: option.min,
                max: option.max,
                step: option.step || null,
                onInput: (e) => {
                    let eventInputValue = e.target.value;
                    if (typeof eventInputValue === 'undefined') {
                        unset(formClientOptions.value, optionKey);
                        return;
                    }
                    if (typeof eventInputValue === 'string') {
                        eventInputValue = eventInputValue.trim();
                    }
                    if (!eventInputValue) {
                        unset(formClientOptions.value, optionKey);
                        return;
                    }
                    if (option.type === 'number' || option.type === 'range') {
                        eventInputValue = Number(eventInputValue);
                    } else if (option.type === 'checkbox') {
                        eventInputValue = e.target.checked;
                    }
                    set(formClientOptions.value, optionKey, eventInputValue);
                },
                class: classList,
            });
            break;
    }

    return h('div', {
        class: 'flex flex-col gap-2',
    }, [
        h(
            'label',
            { class: 'text-white/60 text-xs' },
            option.type === 'range' ? `${option.label}: ${typeof inputValue === 'undefined' ? 'default server value' : inputValue}` : option.label,
        ),
        inputElement,
    ]);
});

const resetSaveAsName = () => {
    saveAsName.value = defaultSaveAsName.value;
};

const save = () => {
    setPreset(saveAsName.value, props.client, formClientOptions.value, saveAsName.value !== defaultSaveAsName.value);
    props.setIsOpen(false);
};

const deletePresetHandler = () => {
    deletePreset(saveAsName.value);
    setActivePresetName('chatgpt');
    props.setIsOpen(false);
};

// watch isOpen prop
watch(() => props.isOpen, (isOpen) => {
    if (isOpen) {
        resetSaveAsName();
    }
});
// watch client prop
watch(() => props.client, (client) => {
    if (client) {
        resetSaveAsName();
        const preset = getPreset(defaultSaveAsName.value)?.options;
        if (preset) {
            formClientOptions.value = JSON.parse(JSON.stringify(preset));
        } else {
            formClientOptions.value = {};
        }
    }
});
</script>

<template>
    <Dialog :open="isOpen" @close="setIsOpen(false)" class="relative z-50">
        <!-- The backdrop, rendered as a fixed sibling to the panel container -->
        <div class="fixed inset-0 bg-black/30" aria-hidden="true" />

        <!-- Full-screen scrollable container -->
        <div class="fixed inset-0 overflow-y-auto">
            <!-- Container to center the panel -->
            <div class="flex min-h-full items-center justify-center p-4">
                <!-- The actual dialog panel -->
                <DialogPanel class="w-full max-w-3xl rounded text-slate-300 bg-white/10 backdrop-blur-lg p-6 shadow-lg">
                    <button
                        @click="setIsOpen(false)"
                        class="absolute top-0 right-0 m-2 text-white/60 hover:text-white/80 transition duration-300 ease-in-out"
                    >
                        <Icon name="bx:bx-x" class="text-2xl" />
                    </button>

                    <DialogTitle class="font-black text-slate-100 text-2xl flex items-center">
                        <GPTIcon
                            v-if="client === 'chatgpt'"
                            class="h-10 py-2 mr-2 block shadow transition duration-300 ease-in-out rounded-lg"
                        />
                        <GPTIcon
                            v-else-if="client === 'chatgpt-browser'"
                            class="h-10 py-2 mr-2 text-[#6ea194] block shadow transition duration-300 ease-in-out rounded-lg"
                        />
                        <BingIcon
                            v-else-if="client === 'bing'"
                            class="h-10 py-2 mr-2 block shadow transition duration-300 ease-in-out rounded-lg"
                        />
                        Settings
                    </DialogTitle>

                    <DialogDescription class="mt-3">
                        <!-- Use generateForm function -->
                        <div class="flex flex-col gap-2">
                            <template
                                v-for="(option, optionName) in availableOptions[client]"
                                :key="optionName"
                            >
                                <component :is="generateForm([option], optionName)[0]" />
                            </template>
                        </div>

                        <div class="flex flex-col sm:flex-row justify-end mt-4 gap-2">
                            <!-- Delete button -->
                            <Transition name="fade">
                                <button
                                    v-if="saveAsName === defaultSaveAsName"
                                    type="button"
                                    class="
                                        flex items-center justify-center px-2 py-2 rounded bg-red-500/50 text-white/70
                                        hover:text-white/90 hover:bg-red-500/60 transition duration-300
                                    "
                                    @click="deletePresetHandler"
                                >
                                    <Icon name="bx:bx-trash" />
                                </button>
                            </Transition>
                            <!-- Save as Name input -->
                            <div class="relative flex flex-col sm:flex-row items-stretch shadow-inner bg-white/5 rounded">
                                <label
                                    class="
                                        text-white/60 text-xs h-full flex items-center px-3 py-2 border-white/5
                                        border-b sm:border-r sm:border-b-0
                                    "
                                >
                                    Preset Name
                                </label>
                                <input
                                    type="text"
                                    class="placeholder-white/40 bg-transparent text-slate-300 text-sm py-2 focus:outline-none pl-3 flex-1"
                                    placeholder="Preset Name"
                                    v-model="saveAsName"
                                />
                                <button
                                    class="
                                        flex items-center justify-center px-3 py-2 group
                                        bg-white/5 sm:bg-transparent
                                    "
                                    @click="resetSaveAsName"
                                >
                                    <Icon name="bx:bx-reset" class="text-white/70 group-hover:text-white/90 transition" />
                                </button>
                            </div>
                            <button
                                type="button"
                                class="
                                    flex items-center justify-center gap-1 py-2
                                    text-slate-300 rounded bg-white/10
                                    transition duration-300 ease-in-out
                                    hover:bg-white/20
                                "
                                @click="save"
                            >
                                <Icon name="bx:bx-save" class="relative text-lg top-[1px] ml-4" /> <span class="mr-4">Save</span>
                            </button>
                        </div>
                        <!-- Fine print -->
                        <div class="mt-2 text-xs text-white/60 text-center sm:text-right">
                            Any changes to settings will not apply for existing conversations.
                        </div>
                    </DialogDescription>
                </DialogPanel>
            </div>
        </div>
    </Dialog>
</template>

<style>
select option {
    @apply text-slate-700;
}
</style>
