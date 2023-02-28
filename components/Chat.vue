<script setup>
import { fetchEventSource } from '@microsoft/fetch-event-source';
import MarkdownIt from 'markdown-it';
import MarkdownItHighlight from 'markdown-it-highlightjs';

const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
});
md.use(MarkdownItHighlight);

const config = useRuntimeConfig();

const messages = ref([]);
const message = ref('');
const processingController = ref(null);

const conversationData = ref({});
const messagesContainerElement = ref(null);
const inputContainerElement = ref(null);

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

    processingController.value = new AbortController();

    message.value = '';

    const messageId = crypto.randomUUID();

    messages.value.push({
        id: messageId,
        text: input,
        role: 'user',
    });

    messages.value.push({
        id: crypto.randomUUID(),
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
                if (response.status === 200) {
                    return;
                }
                throw new Error(`Failed to send message. HTTP ${response.status} - ${response.statusText}`);
            },
            onclose() {
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
                    //console.log(result);
                    botMessage.text = result.details.adaptiveCards?.[0]?.body?.[0]?.text?.trim() || result.response;
                    botMessage.raw = result;
                    nextTick().then(() => scrollToBottom());
                    return;
                }
                if (message.event === 'error') {
                    const error = JSON.parse(message.data);
                    botMessage.text = message.data.error || 'An error occurred. Please try again.';
                    botMessage.raw = error;
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
        processingController.value = null;
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

onMounted(() => {
    window.addEventListener('resize', setChatContainerHeight);
    setChatContainerHeight();
});

onUnmounted(() => {
    window.removeEventListener('resize', setChatContainerHeight);
    stopProcessing();
});
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
                            class="text-xs text-white/50"
                        >
                            {{ message.role }}
                        </div>
                        <!-- message text -->
                        <div
                            class="prose prose-sm prose-invert prose-blockquote:border-l-white/50 max-w-6xl"
                            v-html="(message.role === 'user' || message.raw) ? md.render(message.text) : md.render(`${message.text}█`)"
                        />
                    </div>
                </div>
            </TransitionGroup>
        </div>
        <div
            ref="inputContainerElement"
            class="w-full mx-auto max-w-4xl px-3 flex flex-row absolute left-0 right-0 h-[67px] z-10"
        >
            <div class="relative flex flex-row w-full">
                <div class="flex items-center justify-center absolute w-full -top-12">
                    <button
                        v-if="processingController"
                        @click="stopProcessing"
                        class="py-2 px-4 bg-white/10 backdrop-blur-sm text-slate-300 text-sm shadow rounded ml-3 transition duration-300 ease-in-out hover:bg-white/20"
                    >
                        Stop
                    </button>
                </div>
                <textarea
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
                    class="py-3 px-7 bg-white/10 backdrop-blur-sm text-slate-300 shadow rounded-sm ml-3 transition duration-300 ease-in-out hover:bg-white/20"
                    :class="{
                        'opacity-50 cursor-not-allowed hover:bg-white/10': !!processingController,
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
    @apply m-0 my-2 p-0 whitespace-pre-wrap;
}

.prose pre code {
    background-color: transparent;
    @apply text-xs;
}

.prose pre code .hljs-comment {
    @apply text-slate-500;
}
</style>
