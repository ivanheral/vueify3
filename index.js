var through = require('through2')
var compiler = require('./lib/compiler')

isVue = file => /(\.vue)$/.test(file);

module.exports = function (file, opts) {

  if (!isVue(file)) return through();
  var chunks = []

  return through(
    function (chunk, enc, next) {
      chunks.push(chunk)
      next()
    },
    function (done) {
      var buffer = Buffer.concat(chunks)
      var source = buffer.toString('utf-8')
      compiler(source, file, opts).then(function (src) {
          this.push(src)
          done()
        }.bind(this))
        .catch(done)
    }
  )
};