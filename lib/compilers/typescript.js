module.exports = function (raw) {
    try {
        var babel = require('@babel/core')
        var res = babel.transform(raw, {
            filename: 'file.ts',
            presets: ['@babel/env', '@babel/typescript']
        })
    } catch (err) {}
    return res;
}