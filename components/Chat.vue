<script setup>
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import hljs from 'highlight.js';
import { v4 as uuidv4 } from 'uuid';
import { storeToRefs } from 'pinia';
import BingIcon from '~/components/Icons/BingIcon.vue';
import GPTIcon from '~/components/Icons/GPTIcon.vue';
import ClientDropdown from '~/components/Chat/ClientDropdown.vue';
import ClientSettings from '~/components/Chat/ClientSettings.vue';

marked.setOptions({
    silent: true,
    xhtml: true,
    breaks: true,
    gfm: true,
    highlight: (code, lang) => {
        try {
            return hljs.highlightAuto(code).value;
        } catch {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        }
    },
    langPrefix: 'hljs language-',
});

const config = useRuntimeConfig();

const presetsStore = usePresetsStore();
const {
    activePresetName,
    activePreset,
} = storeToRefs(presetsStore);
const {
    setActivePresetName,
} = presetsStore;

const isClientDropdownOpen = ref(false);
const isClientSettingsModalOpen = ref(false);
const clientSettingsModalClient = ref(null);
const clientSettingsModalPresetName = ref(null);

const messages = ref([]);
const message = ref('');
const processingController = ref(null);
const suggestedResponses = ref([]);

const conversationData = ref({});
const messagesContainerElement = ref(null);
const inputContainerElement = ref(null);
const inputTextElement = ref(null);

const canChangePreset = computed(() => !processingController.value && Object.keys(conversationData.value).length === 0);

// compute number of rows for textarea based on message newlines, up to 7
const inputRows = computed(() => {
    const newlines = (message.value.match(/\n/g) || []).length;
    return Math.min(newlines + 1, 7);
});

const scrollToBottom = () => {
    messagesContainerElement.value.scrollTop = messagesContainerElement.value.scrollHeight;
};

const stopProcessing = () => {
    if (!processingController.value) {
        return;
    }
    processingController.value.abort();
    processingController.value = null;
};

const sendMessage = async (input) => {
    if (processingController.value) {
        return;
    }

    input = input.trim();
    if (!input) {
        return;
    }

    isClientDropdownOpen.value = false;

    suggestedResponses.value = [];
    processingController.value = new AbortController();

    message.value = '';

    const messageId = uuidv4();

    messages.value.push({
        id: messageId,
        text: input,
        role: 'user',
    });

    messages.value.push({
        id: uuidv4(),
        text: '',
        role: 'bot',
    });

    await nextTick();
    scrollToBottom();

    const botMessage = messages.value[messages.value.length - 1];

    let clientOptions;
    if (activePreset.value?.options.clientOptions) {
        clientOptions = {
            ...activePreset.value?.options.clientOptions,
            clientToUse: activePreset.value?.client,
        };
    } else {
        clientOptions = {
            clientToUse: activePresetName.value,
        };
    }

    const data = {
        ...conversationData.value,
        message: input,
        stream: true,
        clientOptions,
    };

    if (
        activePreset.value
        && activePreset.value.client === 'bing'
        && activePreset.value.options.jailbreakMode
        && !conversationData.value.jailbreakConversationId
    ) {
        data.jailbreakConversationId = true;
    }

    const opts = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    };

    try {
        await fetchEventSource(`${config.apiBaseUrl}/conversation`, {
            ...opts,
            openWhenHidden: true,
            signal: processingController.value.signal,
            onopen(response) {
                if (response.status === 200) {
                    return;
                }
                throw new Error(`Failed to send message. HTTP ${response.status} - ${response.statusText}`);
            },
            onclose() {
                throw new Error('Failed to send message. Server closed the connection unexpectedly.');
            },
            onerror(err) {
                throw err;
            },
            onmessage(eventMessage) {
                if (eventMessage.data === '[DONE]') {
                    processingController.value.abort();
                    return;
                }
                if (eventMessage.event === 'result') {
                    const result = JSON.parse(eventMessage.data);
                    if (result.jailbreakConversationId) {
                        conversationData.value = {
                            jailbreakConversationId: result.jailbreakConversationId,
                            parentMessageId: result.messageId,
                        };
                    } else if (result.conversationSignature) {
                        conversationData.value = {
                            conversationId: result.conversationId,
                            conversationSignature: result.conversationSignature,
                            clientId: result.clientId,
                            invocationId: result.invocationId,
                        };
                    } else {
                        conversationData.value = {
                            conversationId: result.conversationId,
                            parentMessageId: result.messageId,
                        };
                    }
                    console.debug(result);
                    const adaptiveText = result.details.adaptiveCards?.[0]?.body?.[0]?.text?.trim();
                    if (adaptiveText) {
                        console.debug('adaptiveText', adaptiveText);
                        botMessage.text = adaptiveText;
                    } else {
                        botMessage.text = result.response;
                    }
                    botMessage.raw = result;
                    if (result.details.suggestedResponses) {
                        suggestedResponses.value = result.details.suggestedResponses.map(response => response.text);
                    }
                    nextTick().then(() => scrollToBottom());
                    return;
                }
                if (eventMessage.event === 'error') {
                    const eventMessageData = JSON.parse(eventMessage.data);
                    botMessage.text = eventMessageData.error || 'An error occurred. Please try again.';
                    botMessage.error = true;
                    botMessage.raw = eventMessageData;
                    nextTick().then(() => scrollToBottom());
                    return;
                }
                botMessage.text += JSON.parse(eventMessage.data);
                nextTick().then(() => scrollToBottom());
            },
        });
    } catch (err) {
        console.error('ERROR', err);
    } finally {
        if (!processingController.value.signal.aborted) {
            processingController.value.abort();
        }
        processingController.value = null;
        await nextTick();
        inputTextElement.value.focus();
    }
};

const setChatContainerHeight = () => {
    const headerElementHeight = document.querySelector('header').offsetHeight;
    const footerElementHeight = document.querySelector('footer').offsetHeight;
    const inputContainerElementHeight = inputContainerElement.value.offsetHeight;
    const heightOffset = window.document.documentElement.clientHeight - window.innerHeight + 50;
    const containerHeight = window.document.documentElement.clientHeight
        - (headerElementHeight + footerElementHeight)
        - inputContainerElementHeight
        - (heightOffset / 2);
    // set container height
    messagesContainerElement.value.style.height = `${containerHeight}px`;
    // move input container element bottom down
    inputContainerElement.value.style.bottom = `${heightOffset}px`;
    scrollToBottom();
};

const parseMarkdown = (text, streaming = false) => {
    text = text.trim();
    let cursorAdded = false;
    // workaround for incomplete code, closing the block if it's not closed
    // First, count occurrences of "```" in the text
    const codeBlockCount = (text.match(/```/g) || []).length;
    // If the count is odd and the text doesn't end with "```", add a closing block
    if (codeBlockCount % 2 === 1 && !text.endsWith('```')) {
        if (streaming) {
            text += '█\n```';
            cursorAdded = true;
        } else {
            text += '\n```';
        }
    }
    if (codeBlockCount) {
        // make sure the last "```" is on a newline
        text = text.replace(/```$/, '\n```');
    }
    if (streaming && !cursorAdded) {
        text += '█';
    }

    // convert to markdown
    let parsed = marked.parse(text);
    // format Bing's source links more nicely
    // 1. replace "[^1^]" with "[1]" (during progress streams)
    parsed = parsed.replace(/\[\^(\d+)\^]/g, '<strong>[$1]</strong>');
    // 2. replace "^1^" with "[1]" (after the progress stream is done)
    parsed = parsed.replace(/\^(\d+)\^/g, '<strong>[$1]</strong>');

    return DOMPurify.sanitize(parsed);
};

const setIsClientSettingsModalOpen = (isOpen, client = null, presetName = null) => {
    isClientSettingsModalOpen.value = isOpen;
    clientSettingsModalClient.value = client;
    clientSettingsModalPresetName.value = presetName || client;
};

if (!process.server) {
    onMounted(() => {
        window.addEventListener('resize', setChatContainerHeight);
        setChatContainerHeight();
    });

    onUnmounted(() => {
        window.removeEventListener('resize', setChatContainerHeight);
        stopProcessing();
    });

    // watch inputRows for change and call `setChatContainerHeight` to adjust height
    watch(inputRows, () => {
        nextTick(() => {
            setChatContainerHeight();
        });
    });
}
</script>

<template>
    <client-only>
        <ClientSettings
            :is-open="isClientSettingsModalOpen"
            :set-is-open="setIsClientSettingsModalOpen"
            :client="clientSettingsModalClient"
            :preset-name="clientSettingsModalPresetName"
        />
    </client-only>
    <div class="flex flex-col flex-grow items-center">
        <div
            ref="messagesContainerElement"
            class="overflow-y-auto w-full rounded-sm pb-12 px-3 lg:px-0"
        >
            <TransitionGroup name="messages">
                <div
                    class="max-w-4xl w-full mx-auto"
                    v-for="message in messages"
                    :key="message.id"
                >
                    <div
                        class="p-3 rounded-sm"
                        :class="{
                            'bg-white/10 backdrop-blur-sm shadow': message.role === 'bot',
                        }"
                    >
                        <!-- role name -->
                        <div
                            class="text-xs text-white/50 mb-1"
                        >
                            <template v-if="message.role === 'bot'">
                                {{ activePreset?.options?.clientOptions?.chatGptLabel || 'AI' }}
                            </template>
                            <template v-else-if="message.role === 'user'">
                                {{ activePreset?.options?.clientOptions?.userLabel || 'User' }}
                            </template>
                            <template v-else>
                                {{ message.role }}
                            </template>
                        </div>
                        <!-- message text -->
                        <div
                            class="prose prose-sm prose-chatgpt break-words max-w-6xl"
                            v-html="(message.role === 'user' || message.raw) ? parseMarkdown(message.text) : parseMarkdown(message.text, true)"
                        />
                    </div>
                </div>
            </TransitionGroup>
        </div>
        <div
            ref="inputContainerElement"
            class="mx-auto w-full max-w-4xl px-3 lg:px-0 flex flex-row absolute left-0 right-0 mb-7 sm:mb-0 z-10"
        >
            <div class="relative flex flex-row w-full justify-center items-stretch rounded shadow">
                <div
                    class="flex gap-2 mb-3 items-stretch justify-center absolute bottom-full"
                    :class="{ 'w-full': !processingController }"
                >
                    <button
                        v-if="processingController"
                        @click="stopProcessing"
                        class="
                            flex-1 py-2 px-5 bg-white/10 backdrop-blur-sm text-slate-300 text-sm
                            shadow rounded transition duration-300 ease-in-out hover:bg-white/20
                        "
                    >
                        Stop
                    </button>
                    <button
                        v-for="response in suggestedResponses"
                        :key="response"
                        @click="sendMessage(response)"
                        class="
                            flex-1 py-2 px-3 bg-white/10 backdrop-blur-sm text-slate-300 text-sm
                            shadow rounded transition duration-300 ease-in-out hover:bg-white/20
                        "
                    >
                        {{ response }}
                    </button>
                </div>
                <Transition name="slide-from-bottom">
                    <ClientDropdown
                        v-if="isClientDropdownOpen"
                        :preset-name="activePresetName"
                        :set-client-to-use="setActivePresetName"
                        :set-is-client-settings-modal-open="setIsClientSettingsModalOpen"
                    />
                </Transition>
                <button
                    @click="isClientDropdownOpen = !isClientDropdownOpen"
                    class="flex items-center w-10 h-10 my-auto ml-2 justify-center absolute left-0 top-0 bottom-0 z-10"
                    :disabled="!canChangePreset"
                >
                    <Transition name="fade" mode="out-in">
                        <GPTIcon
                            v-if="activePresetName === 'chatgpt' || activePreset?.client === 'chatgpt'"
                            class="w-10 h-10 p-2 block transition duration-300 ease-in-out rounded-lg"
                            :class="{
                                'opacity-50 cursor-not-allowed': !!processingController,
                                'opacity-80': !canChangePreset,
                                'hover:bg-black/30 cursor-pointer hover:shadow': canChangePreset,
                                'bg-black/30 shadow': isClientDropdownOpen,
                            }"
                        />
                        <GPTIcon
                            v-else-if="activePresetName === 'chatgpt-browser' || activePreset?.client === 'chatgpt-browser'"
                            class="w-10 h-10 p-2 text-[#6ea194] block transition duration-300 ease-in-out rounded-lg"
                            :class="{
                                'opacity-50 cursor-not-allowed': !!processingController,
                                'opacity-80': !canChangePreset,
                                'hover:bg-black/30 cursor-pointer hover:shadow': canChangePreset,
                                'bg-black/30 shadow': isClientDropdownOpen,
                            }"
                        />
                        <BingIcon
                            v-else-if="activePresetName === 'bing' || activePreset?.client === 'bing'"
                            class="w-10 h-10 p-2 block transition duration-300 ease-in-out rounded-lg"
                            :class="{
                                'opacity-50 cursor-not-allowed': !!processingController,
                                'opacity-80': !canChangePreset,
                                'hover:bg-black/30 cursor-pointer hover:shadow': canChangePreset,
                                'bg-black/30 shadow': isClientDropdownOpen,
                            }"
                        />
                    </Transition>
                </button>
                <textarea
                    ref="inputTextElement"
                    :rows="inputRows"
                    v-model="message"
                    @keydown.enter.exact.prevent="sendMessage(message)"
                    placeholder="Type your message here..."
                    :disabled="!!processingController"
                    class="
                        py-4 pl-14 pr-14 rounded-l-sm text-slate-100 w-full bg-white/5 backdrop-blur-sm
                        placeholder-white/40 focus:outline-none resize-none placeholder:truncate
                    "
                    :class="{
                        'opacity-50 cursor-not-allowed': !!processingController,
                    }"
                />
                <button
                    @click="sendMessage(message)"
                    :disabled="!!processingController"
                    class="
                        flex items-center flex-1
                        px-4 text-slate-300 rounded-r-sm bg-white/5 backdrop-blur-sm
                        transition duration-300 ease-in-out
                    "
                    :class="{
                        'opacity-50 cursor-not-allowed': !!processingController,
                        'hover:bg-white/10 hover:backdrop-blur-sm': !processingController,
                    }"
                >
                    <Icon class="w-5 h-5" name="bx:bxs-send" />
                </button>
            </div>
        </div>
    </div>
</template>

<style>
.messages-move, /* apply transition to moving elements */
.messages-enter-active {
    transition: all 0.3s ease;
}
.messages-enter-from {
    opacity: 0;
    transform: translateY(0);
}
/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.messages-leave-active {
    position: absolute;
    opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.slide-from-bottom-enter-active,
.slide-from-bottom-leave-active{
    transition: all 0.3s ease;
}
.slide-from-bottom-enter-from,
.slide-from-bottom-leave-to {
    transform: translateY(30px);
    opacity: 0;
}

.prose pre {
    @apply whitespace-pre-wrap;
}

.prose pre code {
    background-color: transparent;
    @apply text-xs;
}

.prose pre code .hljs-comment {
    @apply text-slate-500;
}

.prose p {
    word-break: break-word;
}

/* Getting rid of the main default styling of the range input */
input[type="range"] {
    -webkit-appearance: none;
}

input[type="range"]:focus {
    outline: none;
}

/* Styling the track */
input[type="range"]::-webkit-slider-runnable-track,
input[type="range"]::-moz-range-track {
    @apply h-1 bg-white/10 rounded;
}

/* Styling the thumb */
input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    @apply w-4 h-4 bg-slate-300 rounded-full;
}

input[type="range"]::-moz-range-thumb {
    @apply w-4 h-4 bg-slate-300 rounded-full;
}
</style>
