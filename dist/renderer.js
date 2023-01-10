import * as utility from './utility.js';

let currentFile = undefined;
let currentMetaData = undefined;
let currentSettings = undefined;

setupFileDrag();
setupControls();

function setCurrentFile(newFile) {
    if (newFile != undefined && newFile.type.indexOf("video/") != 0) {
        alert("Only Video files are supported.");
        return;
    }

    currentFile = newFile;
    currentMetaData = undefined;

    let blobUrl = newFile !== undefined ? URL.createObjectURL(currentFile) : undefined;
    let mainPlayer = document.getElementById('mainPlayer');
    let currentSrc = mainPlayer.getAttribute('src');
    if (typeof currentSrc == "string" && currentSrc.length > 0) {
        URL.revokeObjectURL(currentSrc);
    }

    if (blobUrl !== undefined) { 
        document.title = "Simple Transcoder - " + currentFile.name; 
        mainPlayer.setAttribute('src', blobUrl);

        SimpleTranscoder.getVideoInfo(currentFile.path).then((data) => {
            try {
                currentMetaData = JSON.parse(data);
                currentMetaData.format.duration = Number(currentMetaData.format.duration);
                updateFileInfo(currentFile);
            }
            catch (e) {
                console.info("Error parsing file metadata");
                console.error(e);
            }
        });
    } else {
        document.title = "Simple Transcoder";
    }
    updateFileInfo(currentFile);
}

function setupFileDrag() {
    let dragOverlay = document.getElementById('dragAndDropOverlay');
    let HTMLDom = document.querySelector('html');

    HTMLDom.addEventListener('dragover', (ev) => {
        dragOverlay.style.display = "flex";
        ev.preventDefault();
    });

    dragOverlay.addEventListener('drop', function dragOverHandler(ev) {
        let files = ev.dataTransfer.files;
        if (files.length > 0){
            setCurrentFile(files[0]);
        }

        dragOverlay.style.display = "none";
        ev.preventDefault();
    });

    dragOverlay.addEventListener('dragleave', (ev) => {
        dragOverlay.style.display = "none";
        ev.preventDefault();
    });
}

function setupControls() {
    let startTimeField = document.getElementById('startTime');
    if (startTimeField && startTimeField.parentElement.getElementsByClassName('input-set-current-div').length > 0) {
        startTimeField.parentElement.getElementsByClassName('input-set-current-div')[0].addEventListener('click', (ev) => {
            let mainPlayer = document.getElementById('mainPlayer');
            let currentTime = mainPlayer.currentTime;
            startTimeField.value = utility.toTimeFormat(currentTime);
            startTimeField.parentElement.classList.toggle("is-dirty", true);
        });
    }

    let endTimeField = document.getElementById('endTime');
    if (endTimeField && endTimeField.parentElement.getElementsByClassName('input-set-current-div').length > 0) {
        endTimeField.parentElement.getElementsByClassName('input-set-current-div')[0].addEventListener('click', (ev) => {
            let mainPlayer = document.getElementById('mainPlayer');
            let currentTime = mainPlayer.currentTime;
            endTimeField.value = utility.toTimeFormat(currentTime);
            endTimeField.parentElement.classList.toggle("is-dirty", true);
        });
    }

    let encodeButton = document.getElementById('encodeButton');
    if (encodeButton) {
        encodeButton.addEventListener('click', encodeVideo);
    }

    let ffmpegLabel = document.getElementById('ffmpegPathLabel');
    if (ffmpegLabel) {
        SimpleTranscoder.getFFmpegPath().then((data) => {
            ffmpegLabel.innerText = data;
        });
    }

    let ffmpegButton = document.getElementById('ffmpegPathButton');
    if (ffmpegButton) {
        ffmpegButton.addEventListener('click', () => {
            SimpleTranscoder.openDialog({
                properties: ['openFile'],
                filters: [
                    { name: 'executables', extensions: ['exe']},
                    { name: "All Files", extensions: ['*'] }
                ]
            }).then((data) => {
                if (!data.cancelled && data.filePaths.length > 0) {
                    SimpleTranscoder.setFFmpegPath(data.filePaths[0])
                    SimpleTranscoder.getFFmpegPath().then((data) => {
                        ffmpegLabel.innerText = data;
                        currentSettings.ffmpegPath = data
                        SimpleTranscoder.saveSettings(currentSettings);
                    });
                }
            });
        });
    }

    let ffmpegResetButton = document.getElementById('ffmpegPathResetButton');
    if (ffmpegResetButton) {
        ffmpegResetButton.addEventListener('click', () => {
            SimpleTranscoder.setFFmpegPath("FFmpeg");
            SimpleTranscoder.getFFmpegPath().then((data) => {
                ffmpegLabel.innerText = data;
                currentSettings.ffmpegPath = data
                SimpleTranscoder.saveSettings(currentSettings);
            });
        });
    }

    let cancelButton = document.getElementById('cancelEncode');
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            console.log("Cancelled Encode");
            SimpleTranscoder.cancelEncode();
        });
    }

    let transcoderHeaderProgress = document.getElementsByClassName('transcoderHeaderProgress');
    if (transcoderHeaderProgress.length > 0) {
        transcoderHeaderProgress[0].addEventListener('click', (e) => {
            let current = e.target;
            while (current != undefined) {
                if (current.classList.contains('transcoder-collapsible')) {
                    current.classList.toggle('expanded');
                    break;
                }
                current = current.parentNode;

            }
        });
    }


    let fileBrowser = document.getElementById('videoFilePicker');
    if (fileBrowser) {
        fileBrowser.onchange = function () {
            if (this.files.length > 0) {
                setCurrentFile(this.files[0]);
            }
        }
    }
}

function updateFileInfo(file) {
    let fileTitleLabel = document.getElementById('fileTitleLabel');
    if (fileTitleLabel) {
        fileTitleLabel.innerText = file.name;
    }

    let fileAudioTracksLabel = document.getElementById('fileAudioTracks');
    if (fileAudioTracksLabel) {
        let count = 0
        if (currentMetaData && currentMetaData.streams) {
            count = currentMetaData.streams.filter((e) => e.codec_type == "audio").length;
        }
        fileAudioTracksLabel.innerText = count;
    }

    let fileSizeLabel = document.getElementById('fileSizeLabel');
    if (fileSizeLabel) {
        fileSizeLabel.innerText = utility.formatBytes(file.size);
    }

    let fileCodecLabel = document.getElementById('fileCodecLabel');
    if (fileCodecLabel) {
        let codec = ""
        if (currentMetaData && currentMetaData.streams) {
            let videoStreams = currentMetaData.streams.filter((e) => e.codec_type == "video");
            if (videoStreams.length > 0) {
                codec = videoStreams[0].codec_long_name;
            }
        }
        fileCodecLabel.innerText = codec;
    }

    let fileBitRateLabel = document.getElementById('fileBitRateLabel');
    if (fileBitRateLabel) {
        let bitRate = 0
        if (currentMetaData && currentMetaData.format.bit_rate) {
            bitRate = Math.round(Number(currentMetaData.format.bit_rate) / 1024);
        }
        fileBitRateLabel.innerText = bitRate + " kbps"
    }
}

function encodeVideo() {
    if (currentFile) {
        let startTime = utility.timeFormatToNumber(document.getElementById('startTime').value);
        let endTime = utility.timeFormatToNumber(document.getElementById('endTime').value);
        let fileTargetSize = utility.byteFormatToNumber(document.getElementById('fileSizeField').value);
        let isAudioMerged = document.getElementById("MergeAudio-Check").checked;
        let duration = currentMetaData.format.duration;

        if (startTime < 0 || startTime > currentMetaData.format.duration) {
            startTime = NaN;
        } 
        if (endTime < 0 || endTime > currentMetaData.format.duration) {
            endTime = NaN;
        }

        if (!isNaN(startTime) && !isNaN(endTime)) {
            if (startTime < endTime) {
                duration = endTime - startTime;
            } else {
                duration -= startTime;
            }
        } else if (!isNaN(startTime)) {
            duration -= startTime;
        } else if (!isNaN(endTime)) {
            duration = endTime;
        }

        let maxBitRate = 1600;
        if (currentSettings){
            let tmp = utility.byteFormatToNumber(currentSettings.maxBitrate);
            if (!isNaN(tmp)) {
                maxBitRate = tmp / 1024;
            }
        }
        console.log(" bitrate " + utility.calculateBitRate(duration, fileTargetSize, maxBitRate) + " kbps.");
        

        let outputName = currentFile.name;

        if (outputName.trim() == "") {
            outputName = "output";
        }

        let codecSelect = document.getElementById("codecSelect");
        let codec = "h264";

        if (codecSelect) {
            codec = codecSelect.value;
        }

        let outputDir = currentFile.path.substring(0, currentFile.path.lastIndexOf('\\'));

        let outputFilePath = currentSettings.outputPath;

        outputFilePath = outputFilePath.replace(/\{sourceFolder\}/, outputDir);
        outputFilePath = outputFilePath.replace(/\{filename\}/, outputName);

        let maxFPS = Number(currentSettings.maxFPS);
        if (isNaN(maxFPS) || maxFPS < 1) {
            maxFPS = 60;
        }

        let options = {
            'file': currentFile.path,
            'startTime': startTime,
            'endTime': endTime,
            'bitrate': utility.calculateBitRate(duration, fileTargetSize, maxBitRate),
            'mergeAudio': isAudioMerged,
            'metaData': currentMetaData,
            'maxFPS': maxFPS,
            'codec': codec,
            'outputFilePath': outputFilePath
        };

        SimpleTranscoder.encodeVideo(options);
    }
}

SimpleTranscoder.getSettings().then((data) => {
    currentSettings = data;
    let mergeAudio = document.getElementById("MergeAudio-Check");
    if (mergeAudio) {
        mergeAudio.checked = data.mergeAudio;
        mergeAudio.parentElement.classList.toggle('is-checked', data.mergeAudio);
        mergeAudio.addEventListener('change', (e) => {
            currentSettings.mergeAudio = e.target.checked;
            SimpleTranscoder.saveSettings(currentSettings);
        });
    }

    let codecSelect = document.getElementById("codecSelect");
    if (codecSelect) {
        codecSelect.value = data.codec;
        codecSelect.addEventListener('change', (e) => {
            currentSettings.codec = e.target.value;
            SimpleTranscoder.saveSettings(currentSettings);
        });
    }

    let fileSizeField = document.getElementById("fileSizeField");
    if (fileSizeField) {
        fileSizeField.value = data.sizeTarget
        fileSizeField.addEventListener('change', (e) => {
            currentSettings.sizeTarget = e.target.value
            SimpleTranscoder.saveSettings(currentSettings);
        });
    }

    let maxBitField = document.getElementById("MaxBitField");
    if (maxBitField) {
        maxBitField.value = data.maxBitrate
        maxBitField.addEventListener('change', (e) => {
            currentSettings.maxBitrate = e.target.value
            SimpleTranscoder.saveSettings(currentSettings);
        });
    }

    let ffmpegLabel = document.getElementById("ffmpegPathLabel");
    if (ffmpegLabel) {
        ffmpegLabel.innerText = data.ffmpegPath;
    }

    let outputPathTextField = document.getElementById('outputPathTextField');
    if (outputPathTextField) {
        outputPathTextField.value = data.outputPath;
        outputPathTextField.addEventListener('change', (e) => {
            currentSettings.outputPath = e.target.value
            SimpleTranscoder.saveSettings(currentSettings);
        });
    }

    let maxFPSField = document.getElementById("fpsLimitField");
    if (maxFPSField) {
        maxFPSField.value = data.maxFPS;
        maxFPSField.addEventListener('change', (e) => {
            currentSettings.maxFPS = e.target.value
            SimpleTranscoder.saveSettings(currentSettings);
        });
    }
});
