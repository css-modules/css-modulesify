var stream = require('stream');
var util = require('util');
var assign = require('object-assign');
var path = require('path');

util.inherits(Cmify, stream.Transform);
function Cmify (filename, opts) {
  if (!(this instanceof Cmify)) {
    return new Cmify(filename, opts);
  }

  stream.Transform.call(this);

  this.cssFilePattern = new RegExp(opts.cssFilePattern || '\.css$');
  this._data = '';
  this._filename = filename;
  this._cssOutFilename = opts.cssOutFilename;
  this._loader = opts.loader;
  this._tokensByFile = opts.tokensByFile;
  this._rootDir = opts.rootDir;
  opts.cssFiles.push(filename);
}

Cmify.prototype.isCssFile = function (filename) {
  return this.cssFilePattern.test(filename);
};

Cmify.prototype._transform = function (buf, enc, callback) {
  // only handle .css files
  if (!this.isCssFile(this._filename)) {
    this.push(buf);
    return callback();
  }

  this._data += buf;
  callback();
};

Cmify.prototype._flush = function (callback) {
  var self = this;
  var filename = this._filename;

  // only handle .css files
  if (!this.isCssFile(filename)) { return callback(); }

  // grab the correct loader
  var loader = this._loader;
  var tokensByFile = this._tokensByFile;

  // convert css to js before pushing
  // reset the `tokensByFile` state
  var relFilename = path.relative(this._rootDir, filename);
  tokensByFile[filename] = loader.tokensByFile[filename] = null;

  loader.fetch(relFilename, '/').then(function (tokens) {
    var deps = loader.deps.dependenciesOf(filename);
    var output = deps.map(function (f) {
      return 'require("' + f + '")';
    });
    output.push('module.exports = ' + JSON.stringify(tokens));

    var isValid = true;
    var isUndefined = /\bundefined\b/;
    Object.keys(tokens).forEach(function (k) {
      if (isUndefined.test(tokens[k])) {
        isValid = false;
      }
    });

    if (!isValid) {
      var err = 'Composition in ' + filename + ' contains an undefined reference';
      console.error(err);
      output.push('console.error("' + err + '");');
    }

    assign(tokensByFile, loader.tokensByFile);

    self.push(output.join('\n'));
    return callback();
  }).catch(function (err) {
    self.push('console.error("' + err + '");');
    self.emit('error', err);
    return callback();
  });
};

module.exports = Cmify;
