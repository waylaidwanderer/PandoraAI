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
                promptPrefix: {
                    type: 'text',
                    label: 'Instructions (Prompt Prefix)',
                },
                userLabel: {
                    type: 'text',
                    label: "User's Name",
                },
                chatGptLabel: {
                    type: 'text',
                    label: "AI's Name",
                },
                modelOptions: {
                    type: 'nested',
                    label: 'Model Options',
                    properties: {
                        model: {
                            type: 'text',
                            label: 'Model',
                            default: 'gpt-3.5-turbo',
                        },
                        temperature: {
                            type: 'number',
                            label: 'Temperature',
                            range: [0, 2],
                            default: 0.8,
                        },
                        top_p: {
                            type: 'number',
                            label: 'Top P',
                            range: [0, 1],
                            default: 1,
                        },
                        presence_penalty: {
                            type: 'number',
                            label: 'Presence Penalty',
                            range: [-2, 2],
                            default: 0,
                        },
                        frequency_penalty: {
                            type: 'number',
                            label: 'Frequency Penalty',
                            range: [-2, 2],
                            default: 0.6,
                        },
                        max_tokens: {
                            type: 'number',
                            label: 'Max Tokens',
                            range: [1, null],
                            default: 1024,
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

const formClientOptions = {};

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
            // TODO: checkbox styling
            return h('input', {
                type: option.type,
                placeholder: option.label,
                value: get(formClientOptions, optionKey),
                onInput: (e) => {
                    let inputValue = e.target.value;
                    if (option.type === 'number') {
                        inputValue = Number(inputValue);
                    } else if (option.type === 'checkbox') {
                        inputValue = e.target.checked;
                    }
                    return set(formClientOptions, optionKey, inputValue);
                },
                class:'shadow-inner bg-white/10 placeholder-white/40 text-slate-300 text-sm rounded p-2 focus:outline-none'
            });
        }
    });
};

const save = () => {
    console.log(formClientOptions);
    // TODO: Save to localStorage
};
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

                                <div class="flex justify-end mt-4">
                                    <button
                                        type="button"
                                        class="inline-flex justify-center px-4 py-2 text-sm font-medium text-slate-100 bg-slate-500 border border-transparent rounded-md hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500"
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
