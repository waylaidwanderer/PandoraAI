<script setup>
const importAppData = () => {
    // get JSON file from user and turn it into localStorage
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = (readerEvent) => {
            const content = readerEvent.target.result;
            localStorage.clear();
            Object.assign(localStorage, JSON.parse(content));
            window.location.reload();
        };
    };
    input.click();
};

const exportAppData = () => {
    // turn localStorage into JSON and save it as a file
    const dataStr = JSON.stringify(localStorage);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = `PandoraAI-${Date.now()}.data.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
};
</script>

<template>
    <button
        @click="importAppData"
        class="flex items-center gap-1 text-white/60 transition duration-300 hover:text-white/80"
    >
        <Icon class="w-4 h-4" name="bx:bx-import" />
        Import
    </button>
    <button
        @click="exportAppData"
        class="flex items-center gap-1 text-white/60 transition duration-300 hover:text-white/80"
    >
        <Icon class="w-4 h-4" name="bx:bx-export" />
        Export
    </button>
</template>
