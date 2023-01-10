const { app, BrowserWindow, ipcMain, dialog } = require('electron');
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

app.whenReady().then(() => {
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
        if (options.codec == "libvpx-vp9") {
            funcArgs.push('-row-mt');
            funcArgs.push('1');
            funcArgs.push('-cpu-used');
            funcArgs.push('3');
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

        /*
        if (!isNaN(encodeItem.width) && Number(encodeItem.width) > 0 && Number(encodeItem.width) < encodeItem.metadata.video_width) {
            funcArgs.push('-vf');
            funcArgs.push(`scale=${Number(encodeItem.width)}:-1:flags=bicubic`);
        } else if (!isNaN(encodeItem.height) && Number(encodeItem.height) > 0 && Number(encodeItem.height) < encodeItem.metadata.video_height) {
            funcArgs.push('-vf');
            funcArgs.push(`scale=-1:${Number(encodeItem.height)}:flags=bicubic`);
        }
        */

        // get audio streams from metaData
        let audioStreams = options.metaData.streams.filter((e) => e.codec_type == "audio");

        if (audioStreams.length > 1 && options.mergeAudio) {
            let audioParams = "";
            for (let index = 0; index < audioStreams.length; index++) {
                audioParams += `[0:a:${index}]`;
            }
            audioParams += "amix=" + audioStreams.length + ":longest:weights=";
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

        ffmpeg = spawn(ffmpegPath, funcArgs.concat(['-c:a', 'libopus', '-b:a', '64k', '-movflags', '+faststart', '-y', '-progress', 'pipe:1', '-stats_period', '0.1', options.outputFilePath]), )

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
            //console.log(`stderr: ${data}`);
        });

        ffmpeg.stdout.on('end', function () {
            mainWindow.webContents.send('encode-complete', progress);
            console.log("ffmpeg complete");
        });
    }
    return false;
}

