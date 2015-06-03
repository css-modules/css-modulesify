var path = require('path');
var through = require('through');
var postcss = require('postcss');
var autoprefixer = require('autoprefixer-core');
var shasum = require('shasum');
var prefixSelector = require('./prefix-selector');
var FileSystemLoader = require('css-modules-loader-core/lib/file-system-loader');

var cssExt = /\.css$/;
module.exports = function (filename) {
  // only handle .css files
  if (!cssExt.test(filename)) {
    return through();
  }

  var data = [];
  return through(function onData (chunk) {
    data.push(chunk);
  }, function end () {
    var raw = data.join('');
    var self = this;

    var loader = new FileSystemLoader(path.dirname(filename));
    loader.fetch(path.basename(filename), '/').then(function (tokens) {
      var output = "module.exports = " + JSON.stringify(tokens) +
          "\nmodule.exports.toString = function () { return " + JSON.stringify(loader.finalSource) + "; }";

      self.queue(output);
      self.queue(null);
    }, function (err) {
      console.error(err);
    });
  });
};
