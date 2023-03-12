function isMobile() {
    return window.innerWidth <= 1024;
}

export const useAppStore = defineStore('appStore', () => {
    const isMobileMenu = ref(isMobile());
    const isMenuOpen = ref(!isMobileMenu.value);
    const isMenuOpening = ref(false);
    const isMenuClosing = ref(false);

    watch(isMenuOpen, (value) => {
        if (value) {
            isMenuOpening.value = true;
            setTimeout(() => {
                isMenuOpening.value = false;
            }, 300);
            return;
        }
        isMenuClosing.value = true;
        setTimeout(() => {
            isMenuClosing.value = false;
        }, 300);
    });

    onMounted(() => {
        window.addEventListener('resize', onResize);
    });

    onBeforeUnmount(() => {
        window.removeEventListener('resize', onResize);
    });

    function onResize() {
        isMobileMenu.value = isMobile();
    }

    return {
        isMobileMenu,
        isMenuOpen,
        isMenuOpening,
        isMenuClosing,
    };
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useAppStore, import.meta.hot));
}
