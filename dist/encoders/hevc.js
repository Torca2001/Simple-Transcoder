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
        "libx265": {
            "bitRateCalc": calculateBitRate,
            "generateArgs": generateArgs,
            "displayName" : "HEVC (Libx)",
        },
        "hevc_nvenc": {
            "bitRateCalc": calculateBitRate,
            "generateArgs": generateArgs,
            "displayName" : "HEVC (NVENC)",
        },
        "hevc_amf": {
            "bitRateCalc": calculateBitRate,
            "generateArgs": generateArgs,
            "displayName" : "HEVC (AMF)",
        },
        "hevc_qsv": {
            "bitRateCalc": calculateBitRate,
            "generateArgs": generateArgs,
            "displayName" : "HEVC (QSV)",
        }
    }

})(typeof exports === 'undefined'? this['hevc'] ={}: exports);

