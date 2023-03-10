export const useChatStore = defineStore('chatStore', () => {
    const clientToUse = useLocalStorage('chatStore/clientToUse', 'chatgpt');

    function setClientToUse(client) {
        clientToUse.value = client;
    }

    return {
        clientToUse,
        setClientToUse,
    };
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useChatStore, import.meta.hot));
}
