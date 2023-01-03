let defaultFileSize = 8 * 1024 * 1024;

export function toTimeFormat(totalTime) {
    if (!totalTime || totalTime < 0) {
        return "00:00";
    }

    let output = "";
    if (totalTime > 60*60) {
        let hours = Math.floor(totalTime / (60*60));
        if (hours < 10) {
            output += "0";
        }
        output += hours + ":";
        totalTime -= hours * 60*60;
    }

    let minutes = Math.floor(totalTime / 60);
    if (minutes < 10) {
        output += "0";
    }
    output += minutes + ":";
    totalTime -= minutes * 60;

    if (totalTime < 10) {
        output += "0";
    }
    output += totalTime.toFixed(3);

    return output;
}

export function byteFormatToNumber(input, defaultSize = 'm') {
    let types = ['b', 'k', 'm', 'g', 't', 'p', 'e', 'z'];

    if (!input || input.trim() == "") {
        return NaN;
    }

    let inputTrimmed = input.trim().toLowerCase();
    if (inputTrimmed.endsWith('b')) {
        inputTrimmed = inputTrimmed.substring(0, inputTrimmed.length - 1);
    }

    if (inputTrimmed.length > 0) {
        let multiplier = types.findIndex((e) => e == defaultSize);
        if (multiplier == -1) {
            multiplier = 0;
        }

        for (let index = 0; index < types.length; index++) {
            if (types[index] == inputTrimmed[inputTrimmed.length - 1]) {
                multiplier = index;
                inputTrimmed = inputTrimmed.substring(0, inputTrimmed.length - 1);
                break;
            }
        }

        return Number(inputTrimmed) * (1024 ** multiplier);
    }
}

export function timeFormatToNumber(input) {
    if (!input || input.trim() == "") {
        return NaN;
    }

    let total = 0;
    for (let strnum of input.split(':')) {
        total *= 60;
        total += Number(strnum);
    }

    return total;
}

export function calculateBitRate(totalTime, targetSize = defaultFileSize, maxBitRate = 1600) {
    //return (8 * 8192) / (1.048576 * totalTime) - 64;
    let scaler = 1000 * 8 / 1024 / 1024;
    return Math.min(Math.floor((targetSize * scaler - 1) * 0.99 / totalTime - 64), maxBitRate);
}

export function calculateMaxtime(targetSize = defaultFileSize, overheadFactor = 0.96) {

    let bitRateMin = 100;
    return Math.floor(targetSize * overheadFactor / (bitRateMin + 64) / 128);
}

export function formatBytes(bytes, decimals = 2) {
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

if (typeof module !== 'undefined') {
    module.exports = {
        toTimeFormat,
        byteFormatToNumber,
        timeFormatToNumber,
        calculateBitRate,
        calculateMaxtime,
        formatBytes,
    };
}