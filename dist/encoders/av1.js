function calculateBitRate(totalTime, size) {
    let scaler = 1000 * 8 / 1024 / 1024;
    return Math.floor((size * scaler - 1) * 0.99 / totalTime - 64);
}

function generateArgs(options) {
    return [];
}

(function(exports){

    exports.codecs = {
        "libaom-av1": {
            "bitRateCalc": calculateBitRate,
            "generateArgs": generateArgs,
            "displayName" : "AV1 (libaom)",
        },
        "av1_nvenc": {
            "bitRateCalc": calculateBitRate,
            "generateArgs": generateArgs,
            "displayName" : "AV1 (NVENC)",
        },
        "av1_qsv": {
            "bitRateCalc": calculateBitRate,
            "generateArgs": generateArgs,
            "displayName" : "AV1 (QSV)",
        },
        "av1_amf": {
            "bitRateCalc": calculateBitRate,
            "generateArgs": generateArgs,
            "displayName" : "AV1 (AMF)",
        }
    }

})(typeof exports === 'undefined'? this['av1'] = {}: exports);