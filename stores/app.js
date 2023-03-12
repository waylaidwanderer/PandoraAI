export const useAppStore = defineStore('appStore', () => {
    const isMenuOpen = ref(true);
    const conversationTitle = ref('New Chat');

    return {
        isMenuOpen,
        conversationTitle,
    };
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useAppStore, import.meta.hot));
}
