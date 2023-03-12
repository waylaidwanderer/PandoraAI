export const useConversationsStore = defineStore('conversationsStore', () => {
    const conversations = useLocalStorage('conversations', {});
    const lastConversationId = useLocalStorage('lastConversationId', '');
    // `conversations` is an array of objects with an id property.
    // Look up the conversation with the id that matches the lastConversationId.
    const activeConversation = computed(() => {
        if (!lastConversationId.value) {
            return {
                data: {},
            };
        }
        return conversations.value[lastConversationId.value] || { data: {} };
    });
    const conversationTitle = computed(() => activeConversation.value.title || 'New Chat');

    // TODO: only allow one conversation to be updated at a time

    function updateConversation(id, updatedConversationData) {
        lastConversationId.value = id;
        const conversation = conversations.value[id];
        if (conversation) {
            conversation.data = updatedConversationData;
            conversation.updatedAt = Date.now();
            return;
        }
        conversations.value[id] = {
            data: updatedConversationData,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
    }

    function startNewConversation() {
        lastConversationId.value = '';
    }

    return {
        activeConversation,
        conversationTitle,
        updateConversation,
        startNewConversation,
    };
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useConversationsStore, import.meta.hot));
}
