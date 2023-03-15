<script setup>
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import hljs from 'highlight.js';
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

const conversationsStore = useConversationsStore();
const {
    newConversationCounter,
    currentConversation,
    processingController,
} = storeToRefs(conversationsStore);
const {
    updateConversation,
} = conversationsStore;

const isClientDropdownOpen = ref(false);
const isClientSettingsModalOpen = ref(false);
const clientSettingsModalClient = ref(null);
const clientSettingsModalPresetName = ref(null);

const activePresetNameToUse = computed(() => currentConversation.value?.activePresetName || activePresetName.value);
const activePresetToUse = computed(() => currentConversation.value?.activePreset || activePreset.value);
const conversationData = ref(currentConversation.value?.data || {});
const messages = ref(currentConversation.value?.messages || []);
const message = ref('');
const suggestedResponses = ref([]);

const messagesContainerElement = ref(null);
const inputContainerElement = ref(null);
const inputTextElement = ref(null);
const chatButtonsContainerElement = ref(null);

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

const setChatContainerHeight = () => {
    const headerElementHeight = document.querySelector('header').offsetHeight;
    const footerElementHeight = document.querySelector('footer').offsetHeight;
    const inputContainerElementHeight = inputContainerElement.value.offsetHeight;
    const chatButtonsContainerElementHeight = chatButtonsContainerElement.value.offsetHeight;
    const heightOffset = window.document.documentElement.clientHeight - window.innerHeight;
    const containerHeight = window.document.documentElement.clientHeight
        - (headerElementHeight + footerElementHeight)
        - inputContainerElementHeight
        - heightOffset
        - chatButtonsContainerElementHeight
        - 50;
    // set container height
    messagesContainerElement.value.style.height = `${containerHeight}px`;
    // move input container element bottom down
    inputContainerElement.value.style.bottom = `${heightOffset}px`;
    scrollToBottom();
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

    // remove id === 'new' and id === 'bot-new' messages
    messages.value = messages.value.filter(_message => !['new', 'bot-new'].includes(_message.id));

    const userMessage = {
        id: 'new',
        parentMessageId: conversationData.value?.parentMessageId,
        text: input,
        role: 'user',
    };
    messages.value.push(userMessage);
    const userMessageIndex = messages.value.length - 1;

    const botMessage = {
        id: 'bot-new',
        text: '',
        role: 'bot',
    };
    messages.value.push(botMessage);
    const botMessageIndex = messages.value.length - 1;

    await nextTick();
    scrollToBottom();

    let clientOptions;
    if (activePresetToUse.value?.options.clientOptions) {
        clientOptions = {
            ...activePresetToUse.value?.options.clientOptions,
            clientToUse: activePresetToUse.value?.client,
        };
    } else {
        clientOptions = {
            clientToUse: activePresetToUse.value?.client || activePresetNameToUse.value,
        };
    }

    const data = {
        ...conversationData.value,
        message: input,
        stream: true,
        clientOptions,
    };

    if (
        activePresetToUse.value
        && activePresetToUse.value.client === 'bing'
        && activePresetToUse.value.options.jailbreakMode
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
                    console.debug(result);
                    messages.value[userMessageIndex].id = result.parentMessageId;
                    messages.value[botMessageIndex].id = result.messageId;
                    messages.value[botMessageIndex].parentMessageId = result.parentMessageId;
                    let conversationId;
                    if (result.jailbreakConversationId) {
                        // Bing jailbreak mode
                        conversationId = result.jailbreakConversationId;
                        conversationData.value = {
                            jailbreakConversationId: result.jailbreakConversationId,
                            parentMessageId: result.messageId,
                        };
                    } else if (result.conversationSignature) {
                        // Bing
                        conversationId = result.conversationId;
                        conversationData.value = {
                            conversationId: result.conversationId,
                            conversationSignature: result.conversationSignature,
                            clientId: result.clientId,
                            invocationId: result.invocationId,
                        };
                    } else {
                        // other clients
                        conversationId = result.conversationId;
                        conversationData.value = {
                            conversationId: result.conversationId,
                            parentMessageId: result.messageId,
                            title: result.title,
                        };
                    }
                    const adaptiveText = result.details.adaptiveCards?.[0]?.body?.[0]?.text?.trim();
                    if (adaptiveText) {
                        console.debug('adaptiveText', adaptiveText);
                        messages.value[botMessageIndex].text = adaptiveText;
                    } else {
                        messages.value[botMessageIndex].text = result.response;
                    }
                    messages.value[botMessageIndex].raw = result;
                    if (result.details.suggestedResponses) {
                        suggestedResponses.value = result.details.suggestedResponses.map(response => response.text);
                    }
                    updateConversation(conversationId, conversationData.value, messages.value, activePresetNameToUse.value, activePresetToUse.value);
                    nextTick(() => {
                        setChatContainerHeight();
                    });
                    return;
                }
                if (eventMessage.event === 'error') {
                    const eventMessageData = JSON.parse(eventMessage.data);
                    messages.value[botMessageIndex].text = eventMessageData.error || 'An error occurred. Please try again.';
                    messages.value[botMessageIndex].error = true;
                    messages.value[botMessageIndex].raw = eventMessageData;
                    nextTick().then(() => scrollToBottom());
                    return;
                }
                messages.value[botMessageIndex].text += JSON.parse(eventMessage.data);
                nextTick().then(() => scrollToBottom());
            },
        });
    } catch (err) {
        console.error('ERROR', err);
    } finally {
        if (!processingController.value?.signal.aborted) {
            processingController.value.abort();
        }
        processingController.value = null;
        await nextTick();
        inputTextElement.value.focus();
    }
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
        nextTick(() => {
            setChatContainerHeight();
        });
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

    watch(isClientDropdownOpen, () => {
        nextTick(() => {
            setChatContainerHeight();
        });
    });

    watch(currentConversation, (newData, oldData) => {
        if (currentConversation.value) {
            conversationData.value = currentConversation.value.data;
            messages.value = currentConversation.value.messages;
            nextTick(() => {
                scrollToBottom();
            });
        } else {
            conversationData.value = {};
            messages.value = [];
        }
        if (newData?.id !== oldData?.id) {
            suggestedResponses.value = [];
        }
    });

    watch(newConversationCounter, () => {
        conversationData.value = {};
        messages.value = [];
        suggestedResponses.value = [];
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
    <div class="flex flex-col flex-grow items-center relative">
        <!--suppress CssInvalidPropertyValue -->
        <div
            ref="messagesContainerElement"
            class="overflow-y-auto w-full rounded-sm pb-12 px-3"
            style="overflow: overlay;"
        >
            <TransitionGroup name="messages">
                <div
                    class="max-w-4xl w-full mx-auto"
                    v-for="(message, index) in messages"
                    :key="index"
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
                                {{ activePresetToUse?.options?.clientOptions?.chatGptLabel || 'AI' }}
                            </template>
                            <template v-else-if="message.role === 'user'">
                                {{ activePresetToUse?.options?.clientOptions?.userLabel || 'User' }}
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
            class="mx-auto w-full max-w-4xl px-3 xl:px-0 flex flex-row absolute left-0 right-0 mb-7 sm:mb-0 z-10"
        >
            <div class="relative flex flex-row w-full justify-center items-stretch rounded shadow">
                <div
                    ref="chatButtonsContainerElement"
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
                        :preset-name="activePresetNameToUse"
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
                            v-if="activePresetNameToUse === 'chatgpt' || activePresetToUse?.client === 'chatgpt'"
                            class="w-10 h-10 p-2 block transition duration-300 ease-in-out rounded-lg"
                            :class="{
                                'opacity-50 cursor-not-allowed': !!processingController,
                                'opacity-80': !canChangePreset,
                                'hover:bg-black/30 cursor-pointer hover:shadow': canChangePreset,
                                'bg-black/30 shadow': isClientDropdownOpen,
                            }"
                        />
                        <GPTIcon
                            v-else-if="activePresetNameToUse === 'chatgpt-browser' || activePresetToUse?.client === 'chatgpt-browser'"
                            class="w-10 h-10 p-2 text-[#6ea194] block transition duration-300 ease-in-out rounded-lg"
                            :class="{
                                'opacity-50 cursor-not-allowed': !!processingController,
                                'opacity-80': !canChangePreset,
                                'hover:bg-black/30 cursor-pointer hover:shadow': canChangePreset,
                                'bg-black/30 shadow': isClientDropdownOpen,
                            }"
                        />
                        <BingIcon
                            v-else-if="activePresetNameToUse === 'bing' || activePresetToUse?.client === 'bing'"
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
input[type="range"]::-webkit-slider-runnable-track {
    @apply h-1 bg-white/10 rounded w-full;
}
input[type="range"]::-moz-range-track {
    @apply h-1 bg-white/10 rounded w-full;
}

/* Styling the thumb */
input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    @apply w-4 h-4 bg-slate-300 rounded-full -m-[0.5em];
}

input[type="range"]::-moz-range-thumb {
    @apply w-4 h-4 bg-slate-300 rounded-full;
}
</style>
