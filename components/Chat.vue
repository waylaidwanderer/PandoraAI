<script setup>
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import hljs from 'highlight.js';
import { v4 as uuidv4 } from 'uuid';

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

const messages = ref([]);
const message = ref('');
const processingController = ref(null);
const suggestedResponses = ref([]);

const conversationData = ref({});
const messagesContainerElement = ref(null);
const inputContainerElement = ref(null);
const inputTextElement = ref(null);

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

    const opts = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...conversationData.value,
            message: input,
            stream: true,
        }),
    };

    try {
        await fetchEventSource(`${config.apiBaseUrl}/conversation`, {
            ...opts,
            signal: processingController.value.signal,
            onopen(response) {
                console.log('opened', response);
                if (response.status === 200) {
                    return;
                }
                throw new Error(`Failed to send message. HTTP ${response.status} - ${response.statusText}`);
            },
            onclose() {
                console.log('closed');
                throw new Error(`Failed to send message. Server closed the connection unexpectedly.`);
            },
            onerror(err) {
                throw err;
            },
            onmessage(message) {
                if (message.data === '[DONE]') {
                    processingController.value.abort();
                    return;
                }
                if (message.event === 'result') {
                    const result = JSON.parse(message.data);
                    if (result.conversationSignature && !result.messageId) {
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
                if (message.event === 'error') {
                    const data = JSON.parse(message.data);
                    botMessage.text = data.error || 'An error occurred. Please try again.';
                    botMessage.error = true;
                    botMessage.raw = data;
                    nextTick().then(() => scrollToBottom());
                    return;
                }
                botMessage.text += JSON.parse(message.data);
                nextTick().then(() => scrollToBottom());
            },
        });
    } catch (err) {
        console.log('ERROR', err);
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
    const containerHeight = window.document.documentElement.clientHeight - (headerElementHeight + footerElementHeight) - inputContainerElementHeight - (heightOffset / 2);
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

if (!process.server) {
    onMounted(() => {
        window.addEventListener('resize', setChatContainerHeight);
        setChatContainerHeight();
    });

    onUnmounted(() => {
        window.removeEventListener('resize', setChatContainerHeight);
        stopProcessing();
    });
}
</script>

<template>
    <div class="flex flex-col flex-grow items-center">
        <div
            ref="messagesContainerElement"
            class="overflow-y-auto w-full rounded-sm pb-12"
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
                            {{ message.role }}
                        </div>
                        <!-- message text -->
                        <div
                            class="prose prose-sm prose-invert prose-blockquote:border-l-white/50 break-words max-w-6xl"
                            v-html="(message.role === 'user' || message.raw) ? parseMarkdown(message.text) : parseMarkdown(message.text, true)"
                        />
                    </div>
                </div>
            </TransitionGroup>
        </div>
        <div
            ref="inputContainerElement"
            class="w-full mx-auto max-w-4xl px-3 lg:px-0 flex flex-row absolute left-0 right-0 h-[67px] z-10"
        >
            <div class="relative flex flex-row w-full justify-center">
                <div
                    class="flex gap-2 mb-3 items-stretch justify-center absolute bottom-full"
                    :class="{ 'w-full': !processingController }"
                >
                    <button
                        v-if="processingController"
                        @click="stopProcessing"
                        class="flex-1 py-2 px-5 bg-white/10 backdrop-blur-sm text-slate-300 text-sm shadow rounded transition duration-300 ease-in-out hover:bg-white/20"
                    >
                        Stop
                    </button>
                    <button
                        v-for="response in suggestedResponses"
                        :key="response"
                        @click="sendMessage(response)"
                        class="flex-1 py-2 px-3 bg-white/10 backdrop-blur-sm text-slate-300 text-sm shadow rounded transition duration-300 ease-in-out hover:bg-white/20"
                    >
                        {{ response }}
                    </button>
                </div>
                <textarea
                    ref="inputTextElement"
                    rows="1"
                    v-model="message"
                    @keydown.enter.exact.prevent="sendMessage(message)"
                    placeholder="Type your message here..."
                    :disabled="!!processingController"
                    class="p-3 rounded-sm text-slate-100 w-full bg-white/5 backdrop-blur-sm placeholder-white/40 shadow-inner shadow focus:outline-none"
                    :class="{
                        'opacity-50 cursor-not-allowed': !!processingController,
                    }"
                />
                <button
                    @click="sendMessage(message)"
                    :disabled="!!processingController"
                    class="py-3 px-7 bg-white/10 backdrop-blur-sm text-slate-300 shadow rounded-sm ml-3 transition duration-300 ease-in-out"
                    :class="{
                        'opacity-50 cursor-not-allowed': !!processingController,
                        'hover:bg-white/20': !processingController,
                    }"
                >
                    Send
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
</style>
