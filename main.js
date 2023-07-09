const { app, BrowserWindow, ipcMain, dialog, clipboard } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const settingsHandler = require('./settings.js');
const fs = require('fs');

// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent()) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
}

function handleSquirrelEvent() {
    if (process.argv.length === 1) {
        return false;
    }

    const ChildProcess = require('child_process');

    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);

    const spawn = function(command, args) {
        let spawnedProcess, error;

        try {
            spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
        } catch (error) {}

        return spawnedProcess;
    };

    const spawnUpdate = function(args) {
        return spawn(updateDotExe, args);
    };

    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
        case '--squirrel-install':
        case '--squirrel-updated':
        // Optionally do things such as:
        // - Add your .exe to the PATH
        // - Write to the registry for things like file associations and
        //   explorer context menus

        // Install desktop and start menu shortcuts
        spawnUpdate(['--createShortcut', exeName]);

        setTimeout(app.quit, 1000);
        return true;

        case '--squirrel-uninstall':
        // Undo anything you did in the --squirrel-install and
        // --squirrel-updated handlers

        // Remove desktop and start menu shortcuts
        spawnUpdate(['--removeShortcut', exeName]);

        setTimeout(app.quit, 1000);
        return true;

        case '--squirrel-obsolete':
        // This is called on the outgoing version of your app before
        // we update to the new version - it's the opposite of
        // --squirrel-updated

        app.quit();
        return true;
    }
};

let mainWindow, ffmpegLoc = "FFmpeg";
let debug = require('inspector').url() !== undefined;

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 650,
        minWidth: 800,
        minHeight: 650,
        webPreferences: {
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    //win.maximize();

    if (!debug) {
        win.removeMenu();
    }

    win.loadFile('dist/index.html');
    return win;
}

//Enable experimental features to allow for audio tracks
app.commandLine.appendSwitch('enable-experimental-web-platform-features');

app.whenReady().then(async () => {
    mainWindow = createWindow()
  
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    ipcMain.handle('getUserFilePath', (_, options) => {
        if (!options) {
            options = {
                properties: ['openFile']
            };
        }
        return dialog.showOpenDialog(options);
    });

    ipcMain.handle('encodeVideo', encodeVideo);
    ipcMain.handle('videoMetaData', (_, file, callback) => getvideoFileMeta(file, callback));
    ipcMain.handle('setFFmpegPath', setFFmpegPath)
    ipcMain.handle('getFFmpegPath', () => ffmpegLoc);
    ipcMain.handle('cancelEncode', cancelEncode);
    ipcMain.handle('getSettings', settingsHandler.loadSettings);
    ipcMain.handle('saveSettings', (_, data) => settingsHandler.saveSettings(data));
    ipcMain.handle('getAvailableEncoders', getAvailableEncoders);

    let settings = settingsHandler.loadSettings();
    if (settings.ffmpegPath) {
        setFFmpegPath(null, settings.ffmpegPath);
    }
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
});

async function setFFmpegPath(_, ffmpegPath) {
    ffmpegPath = ffmpegPath.toLowerCase();
    if (ffmpegPath == "ffmpeg") {
        ffmpegLoc = "FFmpeg";
        return true;
    }
    else {
        let directoryPath = path.dirname(ffmpegPath);
        if (path.extname(ffmpegPath) == "") {
            directoryPath = ffmpegPath;
        }

        if (fs.existsSync(path.join(directoryPath, "ffmpeg.exe")) && fs.existsSync(path.join(directoryPath, "ffprobe.exe"))) {
            ffmpegLoc = directoryPath;
            return true;
        }
    }
    return false;
}

// Load encoders
let encoders = [
    require('./dist/encoders/h264.js'),
    require('./dist/encoders/hevc.js'),
    require('./dist/encoders/vp9.js'),
    require('./dist/encoders/av1.js')
]

if (encoders.length > 0) {
    let newEncoders = {};
    for (let item of encoders) {
        for (let key in item.codecs) {
            newEncoders[key] = item.codecs[key];
        }
    }
    encoders = newEncoders;
}

async function getAvailableEncoders() {
    return await checkEncoders(encoders);
}

async function checkEncoders(encodersToCheck) {
    let validEncoders = new Set();
    for (const encoder in encodersToCheck) {
        let result = await checkCodec(encoder);
        if (result) {
            validEncoders.add(encoder);
        }
    }

    return validEncoders;
}

function checkCodec(codec) {
    return new Promise((resolve, reject) => {
        let ffmpegPath = ffmpegLoc;
        if (ffmpegLoc == "FFmpeg") {
            ffmpegPath = "ffmpeg";
        }

        let args = ['-loglevel', 'error', '-f', 'lavfi', '-i', 'color=black:s=1080x1080', '-vframes', '1', '-an', '-c:v', codec];

        // For some reason this is needed for x265 to not output a bunch of logs
        if (codec == "libx265") {
            args.push('-x265-params');
            args.push('log-level=0');
        }

        args = args.concat(['-f', 'null', '-']);

        let ffmpeg = spawn(ffmpegPath, args);
        let str = "";

        ffmpeg.stderr.on('data', function (data) {
            str += data;
        });

        /*
        ffmpeg.stdout.on('data', function (data) {
            str += data;
        });
        */

        ffmpeg.stderr.on('end', function () {
            resolve(str.length <= 0);
        });
    });
}

function getSystemAvailableCodecs() {
    return new Promise((resolve, reject) => {
        let ffmpegPath = ffmpegLoc;
        if (ffmpegLoc == "FFmpeg") {
            ffmpegPath = "ffmpeg";
        }

        let ffmpeg = spawn(ffmpegPath, ['-hide_banner', '-codecs', '-loglevel', '0']);
        let str = "";

        ffmpeg.stdout.on('data', function (data) {
            str += data;
        });

        ffmpeg.stdout.on('end', function () {
            let codecs = {};

            //^\s{0,4}([\.D][\.E][\.VAS][\.I][\.L][\.S])\s{1,2}(\w*)\s+(.*)$
            let videoCodecRegex = /^\s{0,4}([\.D][\.E][\.V][\.I][\.L][\.S])\s{1,2}(\w*)\s+(.*)$/gm;
            let decoderRegex = /\(\s*decoders:\s*?(.*?)\s*?\)/;
            let encoderRegex = /\(\s*encoders:\s*?(.*?)\s*?\)/;

            let videoCodecs = str.matchAll(videoCodecRegex);

            for (const videoCodec of videoCodecs) {
                codecs[videoCodec[2]] = {
                    canEncode: videoCodec[1].includes("E"),
                    canDecode: videoCodec[1].includes("D")
                };

                let decoders = videoCodec[3].match(decoderRegex);
                if (decoders) {
                    decoders = decoders[1].split(" ");
                    for (const decoder of decoders) {
                        if (!codecs[decoder]) {
                            codecs[decoder] = {
                                canEncode: false,
                                canDecode: true
                            };
                        }

                        codecs[decoder].canDecode = true;
                    }
                }

                let encoders = videoCodec[3].match(encoderRegex);
                if (encoders) {
                    encoders = encoders[1].split(" ");
                    for (const encoder of encoders) {
                        if (!codecs[encoder]) {
                            codecs[encoder] = {
                                canEncode: true,
                                canDecode: false
                            };
                        }

                        codecs[encoder].canEncode = true;
                    }
                }
            }

            resolve(codecs);
        });
    });

}

async function getvideoFileMeta(filePath) {
    return new Promise((resolve, reject) => {
        let str = "";

        let input = 'pipe:0';
        if (filePath.length > 0) {
            input = filePath;
        }

        let ffmpegPath = ffmpegLoc;
        if (ffmpegLoc == "FFmpeg") {
            ffmpegPath = "ffprobe";
        } else {
            ffmpegPath = path.join(ffmpegPath, "ffprobe.exe");
        }
        let ffprobe = spawn(ffmpegPath, ['-print_format', 'json', '-loglevel', '0', '-show_format', '-show_streams', input], )
        ffprobe.stdout.on('data', function (data) {
            str += data;
        });

        ffprobe.stdout.on('end', function () {
            resolve(str);
        });
    });
}

let ffmpeg = undefined

function cancelEncode() {
    ffmpeg?.stdin.write('q');
}

function encodeVideo(_, options) {
    if (typeof options === "object") {

        let progress = {
            pass: 1,
            passCount: 1,
            fps: 0,
            bitrate: 0,
            out_time: "00:00",
            frame: 0,
            speed: 0,
            progress: 'start',
            percentage: 0,
        };

        let frameRate = Number(options.maxFPS);
        if (isNaN(frameRate) || frameRate < 1) {
            frameRate = 60;
        }
        let input = options.file;

        let funcArgs = ['-i', input, '-c:v', options.codec, '-b:v', `${options.bitrate}k`, '-maxrate', `${options.bitrate * 1.1}k`, '-bufsize', '1M', '-r', frameRate];

        if (encoders[options.codec] != undefined ) {
            funcArgs.concat(encoders[options.codec].generateArgs(options));
        }

        let duration = options.metaData.format.duration;

        if (!isNaN(options.startTime) && options.startTime > 0) {
            funcArgs.unshift(options.startTime);
            funcArgs.unshift('-ss');

            if (!isNaN(options.endTime) && options.endTime > options.startTime && options.metaData.format.duration >= options.endTime) {
                funcArgs.push('-t');
                funcArgs.push(options.endTime - options.startTime);
                duration = options.endTime - options.startTime;
            } else {
                duration = duration - options.startTime;
            }
        } else if (!isNaN(options.endTime) && options.endTime > 0 && options.metaData.format.duration >= options.endTime) {
            funcArgs.push('-t');
            funcArgs.push(options.endTime);
            duration = options.endTime;
        }

        progress.duration = duration;

        // Limit video size
        // Set video format to yuv420p, turning off 10 bit
        funcArgs.push('-vf');
        if (!isNaN(options.width) && Number(options.width) >= 200 && Number(options.width) < options.metaData.width) {
            funcArgs.push(`scale=${Number(options.width)}:-1:flags=bicubic,format=yuv420p`);
        } else if (!isNaN(options.height) && Number(options.height) >= 200 && Number(options.height) < options.metaData.height) {
            funcArgs.push(`scale=-1:${Number(options.height)}:flags=bicubic,format=yuv420p`);
        } else {
            funcArgs.push('format=yuv420p');
        }

        // get audio streams from metaData
        let audioStreams = options.metaData.streams.filter((e) => e.codec_type == "audio");

        if (audioStreams.length > 1 && options.mergeAudio) {
            let audioParams = "";
            for (let index = 0; index < audioStreams.length; index++) {
                audioParams += `[0:a:${index}]`;
            }
            
            audioParams += `amix=${ audioStreams.length }:longest:normalize=${ options.normalizeAudio ? "enabled" : "disabled" }:weights=`;
            for (let index = 0; index < audioStreams.length; index++) {
                audioParams += "1 ";
            }
            audioParams += "[aout]";

            funcArgs = funcArgs.concat(['-filter_complex', audioParams, '-map', '0:V:0', '-map', '[aout]']);
        }

        let ffmpegPath = ffmpegLoc;
        if (ffmpegLoc != "FFmpeg") {
            ffmpegPath = path.join(ffmpegPath, "ffmpeg.exe");
        }

        funcArgs = funcArgs.concat([ '-c:a', 'libopus', '-b:a', '64k', '-movflags', '+faststart', '-y', '-progress', 'pipe:1', '-stats_period', '0.1', options.outputFilePath]);

        ffmpeg = spawn(ffmpegPath, funcArgs);

        //informEncode(progress);

        ffmpeg.stdout.on('data', function (data) {

            let tLines = data.toString().split('\n');
            for (let i = 0; i < tLines.length; i++) {
                let key = tLines[i].split('=');
                if (typeof key[0] != 'undefined' && typeof key[1] != 'undefined') {
                    progress[key[0]] = key[1];
                }
            }

            if (progress.out_time_ms) {
                progress.out_time_ms = Number(progress.out_time_ms);
                progress.percentage = progress.out_time_ms / (duration * 10000);
            }

            mainWindow.webContents.send('encode-progress-update', progress);
            //informEncode(progress);
        });

        /* //example
            bitrate: "1836.5kbits/s"
            drop_frames: "1016"
            dup_frames: "0"
            fps: "71.83"
            frame: "1020"
            out_time: "00:00:34.007229"
            out_time_ms: "34007229"
            out_time_us: "34007229"
            pass: 1
            passCount: 1
            progress: "end"
            speed: "2.39x"
            stream_0_0_q: "-1.0"
            total_size: "7806674"
            trimming: false
        */

        ffmpeg.stderr.on("data", data => {
            //encodeItem.log += data.toString();
            console.log(`stderr: ${data}`);
        });

        ffmpeg.stdout.on('end', function () {
            mainWindow.webContents.send('encode-complete', progress);
            console.log("ffmpeg complete");

            if (options.copyOnFinish) {
                clipboard.writeBuffer('FileNameW', Buffer.from(options.outputFilePath + '\0', 'ucs2'));
            }
        });
    }
    return false;
}

