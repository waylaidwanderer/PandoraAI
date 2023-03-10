import { v4 as uuidv4 } from 'uuid';

export const usePresetsStore = defineStore('presetsStore', () => {
    const presets = useLocalStorage('presetsStore/presets', []);
    const activePreset = useLocalStorage('presetsStore/activePreset', null);

    function addPreset(name, client, options, setActive) {
        const preset = {
            id: uuidv4(),
            name,
            client,
            options,
        };
        presets.value.push(preset);
        if (setActive) {
            activePreset.value = preset;
        }
    }

    return {
        presets,
        activePreset,
        addPreset,
    };
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(usePresetsStore, import.meta.hot));
}
