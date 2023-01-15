const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const defaultSettings = {
    ffmpegPath: "FFmpeg",
    maxBitrate: "16000k",
    codec: "h264",
    sizeTarget: "8m",
    mergeAudio: true,
    outputPath: "{sourceFolder}/{filename}-trimmed.mp4",
    maxFPS: 60,
    copyToClipboard: true,
    maxWidth: "1920",
    maxHeight: "1080",
}

function saveSettings(data) {
    try {
        fs.writeFileSync(path.join(app.getPath('userData'), "settings.json"), JSON.stringify(data, null, 4));
    }
    catch (err) {
        console.log(err);
    }
}

function loadSettings() {
    if (!fs.existsSync(path.join(app.getPath('userData'), "settings.json"))) {
        saveSettings(defaultSettings);
    }

    try {
        let data = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), "settings.json")));
        let settings = defaultSettings;
        for (let key in settings) {
            if (data[key] != undefined) {
                switch (typeof settings[key]) {
                    case "number":
                        settings[key] = Number(data[key]);
                        break;
                    case "boolean":
                        settings[key] = Boolean(data[key]);
                        break;
                    default:
                        settings[key] = String(data[key]);
                        break;
                }
            }
        }

        return settings;
    }
    catch (err) {
        console.log(err);
        return defaultSettings;
    }
}

module.exports = { saveSettings, loadSettings };



