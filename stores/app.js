export const useAppStore = defineStore('appStore', () => {
    const isMenuOpen = ref(true);

    return {
        isMenuOpen,
    };
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useAppStore, import.meta.hot));
}
