var path = require('path');
var through = require('through');
var postcss = require('postcss');
var autoprefixer = require('autoprefixer-core');
var shasum = require('shasum');
var prefixSelector = require('./prefix-selector');

function localizeCss (basename, raw, cb) {
  var hash = shasum(raw).substr(0, 5);

  postcss([ autoprefixer ]).process(raw).then(function (result) {
    result.warnings().forEach(function (warn) {
      console.warn(warn.toString());
    });

    // prefix all class selectors to make them globally unique
    var classMap = {};
    result.root.eachRule(function (rule) {
      var uniqueSelector = prefixSelector(basename, hash, rule);
      classMap[rule.selector] = uniqueSelector.replace(/^./, '');
      rule.selector = uniqueSelector;
    });

    return cb(null, classMap, result.root);
  });
}

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
    var basename = path.basename(filename, '.css');
    var self = this;

    localizeCss(basename, raw, function (err, classMap, stylesheet) {
      if (err) { throw err; }

      var output = "module.exports = " + JSON.stringify(classMap) +
        "\nmodule.exports.toString = function () { return " + JSON.stringify(stylesheet.toString()) + "; }";

      self.queue(output);
      self.queue(null);
    });
  });
};
