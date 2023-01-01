let currentFile = undefined;
let currentMetaData = undefined;

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
                console.log(currentMetaData)
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
            startTimeField.value = toTimeFormat(currentTime);
            startTimeField.parentElement.classList.toggle("is-dirty", true);
        });
    }

    let endTimeField = document.getElementById('endTime');
    if (endTimeField && endTimeField.parentElement.getElementsByClassName('input-set-current-div').length > 0) {
        endTimeField.parentElement.getElementsByClassName('input-set-current-div')[0].addEventListener('click', (ev) => {
            let mainPlayer = document.getElementById('mainPlayer');
            let currentTime = mainPlayer.currentTime;
            endTimeField.value = toTimeFormat(currentTime);
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
                    console.log(data.filePaths[0]);
                    SimpleTranscoder.setFFmpegPath(data.filePaths[0])
                    SimpleTranscoder.getFFmpegPath().then((data) => {
                        ffmpegLabel.innerText = data;
                    });
                }
            });
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
        let fileInfoText = "";
        if (file) {
            fileInfoText = file.name + " (" + formatBytes(file.size) + ")";
        }
        fileTitleLabel.innerText = fileInfoText;
        let fileAudioTracksLabel = document.getElementById('fileAudioTracks');
        if (fileAudioTracksLabel) {
            let count = 0
            if (currentMetaData && currentMetaData.streams) {
                count = currentMetaData.streams.filter((e) => e.codec_type == "audio").length;
            }
            fileAudioTracksLabel.innerText = count;
        }
    }
}

function encodeVideo() {
    if (currentFile) {
        let startTime = timeFormatToNumber(document.getElementById('startTime').value);
        let endTime = timeFormatToNumber(document.getElementById('endTime').value);
        let fileTargetSize = byteFormatToNumber(document.getElementById('fileSizeField').value);
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

        console.log(" bitrate " + calculateBitRate(duration, fileTargetSize) + " kbps.");
        

        let outputName = "output.mp4";

        if (outputName.trim() == "") {
            outputName = currentFile.name;
        }

        let outputDir = currentFile.path.substring(0, currentFile.path.lastIndexOf('\\'));
        let outputFilePath = outputDir + '\\' + outputName;

        let options = {
            file: currentFile.path,
            startTime: startTime,
            endTime: endTime,
            bitrate: calculateBitRate(duration, fileTargetSize),
            mergeAudio: isAudioMerged,
            metaData: currentMetaData,
            codec: 'h264_nvenc',
            outputFilePath: outputFilePath
        };

        SimpleTranscoder.encodeVideo(options);
    }
}

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

