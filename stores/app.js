export const useAppStore = defineStore('appStore', () => {
    const isMenuOpen = ref(window.innerWidth > 1024);
    const isMenuOpening = ref(false);

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
    };
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useAppStore, import.meta.hot));
}
