var babel = require('@babel/core')

module.exports = function (raw) {
  try {
    var res = babel.transform(raw, {
      presets: ['@babel/env']
    })
  } catch (err) {
    return err;
  }
  return res;
}