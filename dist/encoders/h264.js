function calculateBitRate(start, end, size) {
    let scaler = 1000 * 8 / 1024 / 1024;
    let totalTime = end - start;

    return Math.min(Math.floor((size * scaler - 1) * 0.99 / totalTime - 64), maxBitRate);
}

function generateArgs(options) {
    return [];
}

(function(exports){

    exports.codecs = {
        "h264": {
            "bitRateCalc": calculateBitRate,
            "generateArgs": generateArgs,
            "displayName" : "H.264",
        },
        "h264_nvenc": {
            "bitRateCalc": calculateBitRate,
            "generateArgs": generateArgs,
            "displayName" : "H.264 (NVENC)",
        },
        "h264_amf": {
            "bitRateCalc": calculateBitRate,
            "generateArgs": generateArgs,
            "displayName" : "H.264 (AMF)",
        },
        "h264_qsv": {
            "bitRateCalc": calculateBitRate,
            "generateArgs": generateArgs,
            "displayName" : "H.264 (QSV)",
        }
    }

})(typeof exports === 'undefined'? this['h264'] = {}: exports);

