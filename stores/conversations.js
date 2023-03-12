export const useConversationsStore = defineStore('conversationsStore', () => {
    const activeConversation = ref(null);
    const conversationTitle = ref('New Chat');

    return {
        activeConversation,
        conversationTitle,
    };
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useConversationsStore, import.meta.hot));
}
