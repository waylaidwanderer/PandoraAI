import { v4 as uuidv4 } from 'uuid';

export const usePresetsStore = defineStore('presetsStore', () => {
    const presets = useLocalStorage('presetsStore/presets', []);
    const activePreset = useLocalStorage('presetsStore/activePreset', null);

    function setPreset(id, name, client, options, setActive) {
        let preset;
        // update preset by ID or add new
        const existingIndex = presets.value.findIndex(_preset => _preset.id === id);
        if (existingIndex !== -1) {
            const existingPreset = presets.value[existingIndex];
            // only update options as the other values are not editable
            existingPreset.options = options;
            presets.value[existingIndex] = existingPreset;
        } else {
            // count how many other presets have the same name
            const count = presets.value.filter(_preset => _preset.name === name).length;
            // if there are any, append a number to the name
            let newName;
            if (count > 0) {
                newName = `${name} (${count + 1})`;
            } else {
                newName = name;
            }
            preset = {
                id: id || uuidv4(),
                name: newName,
                client,
                options,
                createdAt: Date.now(),
            };
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
