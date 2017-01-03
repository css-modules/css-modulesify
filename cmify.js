var stream = require("stream");
var path = require("path");
var util = require("util");

util.inherits(Cmify, stream.Transform);
function Cmify(filename, opts) {
  if (!(this instanceof Cmify)) {
    return new Cmify(filename, opts);
  }

  stream.Transform.call(this);

  this.cssFilePattern = new RegExp(opts.cssFilePattern || '\.css$');
  this._data = "";
  this._filename = filename;
  this._cssOutFilename = opts.cssOutFilename;
}

Cmify.prototype.isCssFile = function (filename) {
  return this.cssFilePattern.test(filename)
}

Cmify.prototype._transform = function (buf, enc, callback) {
  // only handle .css files
  if (!this.isCssFile(this._filename)) {
    this.push(buf)
    return callback()
  }

  this._data += buf
  callback()
};

module.exports = Cmify
