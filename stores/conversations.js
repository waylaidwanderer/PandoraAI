export const useConversationsStore = defineStore('conversationsStore', () => {
    const newConversationCounter = ref(0);
    const conversations = useLocalStorage('conversations/v1', {});
    const currentConversationId = ref('');
    const processingController = ref(null);

    const currentConversation = computed(() => {
        if (!currentConversationId.value) {
            return null;
        }
        return conversations.value[currentConversationId.value] || null;
    });
    const conversationTitle = computed(() => currentConversation.value?.title || 'New Chat');

    function updateConversation(id, updatedConversationData, messages, activePresetName, activePreset) {
        currentConversationId.value = id;
        const conversation = conversations.value[id];
        if (conversation) {
            conversation.data = updatedConversationData;
            conversation.messages = messages;
            conversation.updatedAt = Date.now();
            return;
        }
        conversations.value[id] = {
            id,
            data: updatedConversationData,
            title: updatedConversationData.title || 'New Chat',
            messages,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            activePresetName,
            activePreset,
        };
    }

    function startNewConversation() {
        if (processingController.value) {
            return;
        }
        // this counter is really only meant for watcher to trigger updates
        newConversationCounter.value += 1;
        currentConversationId.value = '';
    }

    function setCurrentConversationId(id) {
        if (processingController.value) {
            return;
        }
        currentConversationId.value = id;
    }

    function deleteConversation(id) {
        if (processingController.value) {
            return;
        }
        delete conversations.value[id];
        startNewConversation();
    }

    function clearConversations() {
        if (processingController.value) {
            return;
        }
        conversations.value = {};
        startNewConversation();
    }

    function updateConversationTitle(id, title) {
        const conversation = conversations.value[id];
        if (conversation) {
            conversation.title = title.trim();
        }
    }

    return {
        processingController,
        newConversationCounter,
        conversations,
        currentConversationId,
        currentConversation,
        conversationTitle,
        updateConversation,
        startNewConversation,
        setCurrentConversationId,
        deleteConversation,
        clearConversations,
        updateConversationTitle,
    };
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useConversationsStore, import.meta.hot));
}
