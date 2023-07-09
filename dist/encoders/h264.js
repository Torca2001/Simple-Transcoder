function calculateBitRate(totalTime, size) {
    let scaler = 8 / 1024;
    return Math.floor((size * scaler - 1) * 0.95 / totalTime - 64);
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

