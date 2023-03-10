import { v4 as uuidv4 } from 'uuid';

export const usePresetsStore = defineStore('presetsStore', () => {
    const presets = useLocalStorage('presetsStore/presets', []);
    const activePreset = useLocalStorage('presetsStore/activePreset', null);

    function setPreset(id, name, client, options, setActive) {
        const preset = {
            id: id || uuidv4(),
            name,
            client,
            options,
        };
        // update preset by ID or add new
        const existingIndex = presets.value.findIndex((preset) => preset.id === id);
        if (existingIndex !== -1) {
            presets.value[existingIndex] = preset;
        } else {
            presets.value.push(preset);
        }
        if (setActive) {
            activePreset.value = preset;
        }
    }

    function updatePresetOptions(id, options) {
        const preset = presets.value.find((preset) => preset.id === id);
        preset.options = options;
    }

    function getPreset(id) {
        return presets.value.find((preset) => preset.id === id);
    }

    return {
        presets,
        activePreset,
        setPreset,
        getPreset,
    };
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(usePresetsStore, import.meta.hot));
}
