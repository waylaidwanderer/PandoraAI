export const useAppStore = defineStore('appStore', () => {
    const isMenuOpen = ref(true);
    const isMenuOpening = ref(false);
    const conversationTitle = ref('New Chat');

    watch(isMenuOpen, (value) => {
        if (value) {
            isMenuOpening.value = true;
            setTimeout(() => {
                isMenuOpening.value = false;
            }, 300);
        }
    });

    return {
        isMenuOpen,
        isMenuOpening,
        conversationTitle,
    };
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useAppStore, import.meta.hot));
}
