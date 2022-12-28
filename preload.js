const {ipcRenderer, contextBridge} = require('electron');

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }
});

contextBridge.exposeInMainWorld('SimpleTranscoder', {
    openDialog(options) {
        return ipcRenderer.invoke('getUserFilePath', options);
    },
    encodeVideo(options) {
        if (typeof options === "object") {
            options.ffmpegPath = "ffmpeg";
        }
        
        return ipcRenderer.invoke('encodeVideo', options);
    },
    getVideoInfo(file) {
        return ipcRenderer.invoke('videoMetaData', file);
    },
    setFFmpegPath(path) {
        return ipcRenderer.invoke('setFFmpegPath', path);
    },
    getFFmpegPath() {
        return ipcRenderer.invoke('getFFmpegPath');
    }
});

ipcRenderer.on('encode-progress-update', function (evt, message) {
    console.log(message);
});


