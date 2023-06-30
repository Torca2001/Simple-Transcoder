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
        let encodeButton = document.getElementById("encodeButton");
        if (encodeButton) {
            encodeButton.disabled = true;
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
    },
    cancelEncode() {
        return ipcRenderer.invoke('cancelEncode');
    },
    getSettings() {
        return ipcRenderer.invoke('getSettings');
    },
    saveSettings(settings) {
        return ipcRenderer.invoke('saveSettings', settings);
    },
    getAvailableEncoders() {
        return ipcRenderer.invoke('getAvailableEncoders');
    }
});

function updateProgressBar(progress) {
    if (!progress) {
        return;
    }

    let progPerc = progress.percentage 
    let progressPercRnd = Math.round(progress.percentage);

    if (Math.abs(progress.out_time_ms/1000000 - progress.duration) < 0.1) {
        progPerc = 100;
    }

    let progressBar = document.getElementsByClassName("transcoderProgressBar");
    if (progressBar.length > 0) {
        progressBar[0].setAttribute("value", progressPercRnd);
        progressBar[0].classList.toggle("error", false);
    }

    let progressValue = document.getElementsByClassName("transcoderProgressValue");
    if (progressValue.length > 0) {
        progressValue[0].style.width = progPerc + "%";
    }

    let progressPercent = document.getElementById("progressPercent");
    if (progressPercent) {
        progressPercent.innerText = progressPercRnd + "%";
    }

    let progressInfo = document.getElementsByClassName("transcoder__info");
    if (progressInfo.length > 0) {
        progressInfo[0].innerHTML = `
        <span>Bitrate: ${progress.bitrate}</span>
        <span> Speed: ${progress.speed}</span>
        <span>Fps: ${progress.fps}</span>
        <span>Time: ${progress.out_time}</span>
        <span>Size: ${formatBytes(progress.total_size)}</span>
        <span>Frames: ${progress.frame}</span>
        `;
    }
}

ipcRenderer.on('encode-progress-update', function (evt, message) {
    //console.log(message);
    let progressDiv = document.getElementsByClassName("progressDiv");
    if (progressDiv.length > 0) {
        progressDiv[0].classList.toggle("hidden", false);
    }

    if (hideProgressTimeout) {
        clearTimeout(hideProgressTimeout);
        hideProgressTimeout = undefined;
    }

    updateProgressBar(message);
});

let hideProgressTimeout = undefined;

ipcRenderer.on('encode-complete', function (evt, message) {
    let encodeButton = document.getElementById("encodeButton");
    if (encodeButton) {
        encodeButton.disabled = false;
    }

    updateProgressBar(message);

    let progressBar = document.getElementsByClassName("transcoderProgressBar");
    if (progressBar.length > 0) {
        progressBar[0].classList.toggle("error", Math.abs(message.out_time_ms/1000000 - message.duration) > 0.1);
    }

    if (hideProgressTimeout) {
        clearTimeout(hideProgressTimeout);
        hideProgressTimeout = undefined;
    }

    hideProgressTimeout = setTimeout(() => {
        let progressDiv = document.getElementsByClassName("progressDiv");
        if (progressDiv.length > 0) {
            progressDiv[0].classList.toggle("hidden", true);
        }

        hideProgressTimeout = undefined;
    }, 5000);
});

function formatBytes(bytes, decimals = 2) {
    if (isNaN(bytes)) {
        return 'N/A';
    }
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}