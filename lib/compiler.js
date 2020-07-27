try {
  require.resolve('@vue/compiler-sfc')
} catch (e) {
  throw new Error(
    'vueify requires @vue/compiler-sfc to be present in the dependency ' +
    'tree.'
  )
}
var compilers = require('./compilers');
var path = require('path');
var hash = require('hash-sum');
var v = require('@vue/compiler-sfc');

const defaultOptions = {
  include: /\.vue$/,
  exclude: [],
  target: 'browser',
  exposeFilename: false,
  customBlocks: [],
}

module.exports = async function (content, filePath, opts) {

  const options = {
    ...defaultOptions,
    ...opts,
  }

  const isServer = options.target === 'node'
  const isProduction =
    process.env.NODE_ENV === 'production' || process.env.BUILD === 'production'
  const rootContext = process.cwd()
  const id = hash(isProduction ? filePath + '\n' + code : filePath)
  // descriptor
  const {
    descriptor,
    errors
  } = await v.parse(content, {
    sourceMap: true,
    filename: id,
    sourceRoot: rootContext,
    pad: 'line',
  });
  const hasScoped = descriptor.styles.some((s) => s.scoped)
  // template
  const block = descriptor.template
  const result = v.compileTemplate({
    source: block.content,
    inMap: block.map,
    filename: _(path.basename(filePath)),
    preprocessLang: block.lang,
    compiler: options.compiler,
    ssr: isServer,
    compilerOptions: {
      ...options.compilerOptions,
      scopeId: hasScoped ? `data-v-${query.id}` : undefined,
    },
    transformAssetUrls: options.transformAssetUrls || true,
  })
  // process script
  const result_script = await processScript(descriptor.script.content, descriptor.script.lang);
  const result_template = await processScript(result.code);
  var new_script = `;(function(){\n${result_script}\n})()\n` +
    'if (module.exports.__esModule) module.exports = module.exports.default\n'
  new_script += 'var _default = (typeof module.exports === "function"? module.exports.options: module.exports)\n'
  var script_final = mergeParts(new_script, result_template, isServer, rootContext, filePath, isProduction, hasScoped);
  return `${script_final} module.exports = _default;`;
};

function mergeParts(script, template, isServer, rootContext, filePath, isProduction, hasScoped) {
  const output = [
    script,
    template,
    isServer ? `_default.ssrRender = ssrRender` : `_default.render = render`,
  ]
  if (hasScoped) {
    output.push(`_default.__scopeId = ${_(`data-v-${id}`)}`)
  }

  const shortFilePath = path.relative(rootContext, filePath)
    .replace(/^(\.\.[\/\\])+/, '')
    .replace(/\\/g, '/')

  if (!isProduction) {
    output.push(`_default.__file = ${_(shortFilePath)};`)
  } else if (options.exposeFilename) {
    output.push(`_default.__file = ${_(basename(shortFilePath))};`)
  }
  return output.join('\n');
}

function _(any) {
  return JSON.stringify(any)
}

async function compileAsPromise(type, source, lang) {
  var compile = compilers[lang]
  if (compile) {
    return new Promise(function (resolve, reject) {
      resolve(compile(source))
    })
  } else {
    return Promise.resolve(source)
  }
}

async function processScript(script, lang) {
  if (!script) return Promise.resolve();
  var lang = lang ? lang : 'babel';
  const res = await compileAsPromise('script', script, lang);
  return Promise.resolve(typeof res === 'string' ? res : res.code);
}