function calculateBitRate(start, end, size) {
    let scaler = 1000 * 8 / 1024 / 1024;
    let totalTime = end - start;

    return Math.min(Math.floor((size * scaler - 1) * 0.99 / totalTime - 64), maxBitRate);
}

function generateArgs(options) {
    return ['-row-mt', '1', '-cpu-used', '3']
}

function generateArgsQSV(options) {
    return [];
}

(function(exports){

    exports.codecs = {
        "libvpx-vp9": {
            "bitRateCalc": calculateBitRate,
            "generateArgs": generateArgs,
            "displayName" : "VP9",
        },
        "vp9_qsv": {
            "bitRateCalc": calculateBitRate,
            "generateArgs": generateArgsQSV,
            "displayName" : "VP9 (QSV)",
        }
    }

})(typeof exports === 'undefined'? this['vp9'] ={}: exports);

