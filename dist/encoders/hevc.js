function calculateBitRate(totalTime, size) {
    let scaler = 8 / 1024;
    return Math.floor((size * scaler - 1) * 0.95 / totalTime - 64);
}

function generateArgs(options) {
    return [];
}

(function(exports){

    exports.codecs = {
        "libx265": {
            "bitRateCalc": calculateBitRate,
            "generateArgs": generateArgs,
            "displayName" : "HEVC",
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

