<script setup>
import {
    Dialog,
    DialogTitle,
    DialogDescription,
    DialogPanel,
} from '@headlessui/vue';
import GPTIcon from '~/components/Icons/GPTIcon.vue';
import BingIcon from '~/components/Icons/BingIcon.vue';
import set from 'lodash/set';
import get from 'lodash/get';

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
        default: 'chatgpt',
    },
});

const availableOptions = {
    chatgpt: {
        clientOptions: {
            type: 'nested',
            label: 'Client Options',
            properties: {
                openaiApiKey: {
                    type: 'text',
                    label: 'OpenAI API Key',
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
                            range: [0, 2],
                            step: 0.01,
                        },
                        top_p: {
                            type: 'range',
                            label: 'Top P',
                            range: [0, 1],
                            step: 0.01,
                        },
                        presence_penalty: {
                            type: 'range',
                            label: 'Presence Penalty',
                            range: [-2, 2],
                            step: 0.01,
                        },
                        frequency_penalty: {
                            type: 'range',
                            label: 'Frequency Penalty',
                            range: [-2, 2],
                            step: 0.01,
                        },
                        max_tokens: {
                            type: 'range',
                            label: 'Max Tokens',
                            range: [1, 4096],
                            step: 1,
                        },
                    },
                },
            }
        },
    },
    bing: {
        jailbreakMode: {
            type: 'checkbox',
            label: 'Jailbreak Mode',
        },
        clientOptions: {
            type: 'nested',
            label: 'Client Options',
            properties: {
                cookies: {
                    type: 'text',
                    label: 'Cookies',
                },
            },
        },
    },
};

const formClientOptions = ref({});

// computed default saveAsName based on client, using switch
const defaultSaveAsName = computed(() => {
    if (!props.client) {
        return '';
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

const saveAsName = ref('');

// Recursive form generation component
const generateForm = (options, parentKey, levels = 0) => {
    return Object.entries(options).map(([key, value]) => {
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
        } else { // other types like text, number, checkbox etc.
            // TODO: checkbox styling, range slider, textarea
            let classList = 'w-full placeholder-white/40 text-slate-300 text-sm rounded py-2 focus:outline-none';
            switch (option.type) {
                case 'range':
                    classList = `${classList} bg-transparent`;
                    break;
                default:
                    classList = `${classList} shadow-inner bg-white/5 px-3`;
                    break;
            }
            const inputValue = get(formClientOptions.value, optionKey);
            return h('div', {
                class: 'flex flex-col gap-2',
            }, [
                h('label',
                    { class: 'text-white/60 text-xs' },
                    option.type === 'range' ? `${option.label}: ${typeof inputValue === 'undefined' ? 'default server value' : inputValue}` : option.label,
                ),
                h('input', {
                    type: option.type,
                    placeholder: 'default server value',
                    value: inputValue,
                    min: option.range ? option.range[0] : null,
                    max: option.range ? option.range[1] : null,
                    step: option.step || null,
                    onInput: (e) => {
                        let inputValue = e.target.value;
                        if (option.type === 'number' || option.type === 'range') {
                            inputValue = Number(inputValue);
                        } else if (option.type === 'checkbox') {
                            inputValue = e.target.checked;
                        }
                        return set(formClientOptions.value, optionKey, inputValue);
                    },
                    class: classList,
                })
            ]);
        }
    });
};

const resetSaveAsName = () => {
    saveAsName.value = defaultSaveAsName.value;
};

const save = () => {
    console.log(formClientOptions);
    // TODO: Save to localStorage
    // TODO: if preset name is not default, set as active
};

// watch isOpen prop
watch(() => props.isOpen, (isOpen) => {
    if (isOpen) {
        resetSaveAsName();
    }
});
</script>

<template>
    <Dialog :open="true" @close="setIsOpen(false)" class="relative z-50">
        <!-- This is a hack because TransitionRoot does not work on enter properly  -->
        <transition name="fade">
            <div v-if="isOpen">
                <!-- The backdrop, rendered as a fixed sibling to the panel container -->
                <div class="fixed inset-0 bg-black/30" aria-hidden="true" />

                <!-- Full-screen scrollable container -->
                <div class="fixed inset-0 overflow-y-auto">
                    <!-- Container to center the panel -->
                    <div class="flex min-h-full items-center justify-center p-4">
                        <!-- The actual dialog panel -->
                        <DialogPanel class="w-full max-w-3xl rounded text-slate-300 bg-white/10 backdrop-blur-lg p-6 shadow-lg">
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

                                <div class="flex justify-end mt-4 gap-2">
                                    <!-- Save as Name input -->
                                    <div class="relative flex items-stretch shadow-inner bg-white/5 rounded">
                                        <label class="text-white/60 text-xs h-full flex items-center px-3 border-r border-white/5">
                                            Preset Name
                                        </label>
                                        <input
                                            type="text"
                                            class="placeholder-white/40 bg-transparent text-slate-300 text-sm py-2 focus:outline-none pl-3"
                                            placeholder="Preset Name"
                                            v-model="saveAsName"
                                        />
                                        <button
                                            class="flex items-center px-3 group"
                                            @click="resetSaveAsName"
                                        >
                                            <Icon name="bx:bx-reset" class="text-slate-300 group-hover:text-slate-100 transition" />
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        class="
                                            flex items-center
                                            px-4 py-2 text-slate-300 rounded bg-white/10
                                            transition duration-300 ease-in-out
                                            hover:bg-white/20
                                        "
                                        @click="save"
                                    >
                                        Save
                                    </button>
                                </div>
                            </DialogDescription>
                        </DialogPanel>
                    </div>
                </div>
            </div>
        </transition>
    </Dialog>
</template>
