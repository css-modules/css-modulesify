var fs = require('fs');
var path = require('path');
var through = require('through');
var Core = require('css-modules-loader-core');
var FileSystemLoader = require('css-modules-loader-core/lib/file-system-loader');
var assign = require('object-assign');
var stringHash = require('string-hash');

/*
  Custom `generateScopedName` function for `postcss-modules-scope`.
  Appends a hash of the css source.
*/
function createScopedNameFunc (plugin) {
  var orig = plugin.generateScopedName;
  return function (name, path, css) {
    var hash = stringHash(css).toString(36).substr(0, 5);
    return orig.apply(plugin, arguments) + '___' + hash;
  }
};

var cssExt = /\.css$/;
module.exports = function (browserify, options) {
  options = options || {};

  var cssOutFilename = options.output || options.o;
  if (!cssOutFilename) {
    throw new Error('css-modulesify needs the --output / -o option (path to output css file)');
  }

  // PostCSS plugins passed to FileSystemLoader
  var plugins = options.use || options.u;
  if (!plugins) {
    plugins = Core.defaultPlugins;
  } else {
    if (typeof plugins === 'string') {
      plugins = [ plugins ];
    }

    plugins = plugins.map(function requirePlugin (name) {
      // assume functions are already required plugins
      if (typeof name === 'function') {
        return name;
      }

      var plugin = require(require.resolve(name));

      // custom scoped name generation
      if (name === 'postcss-modules-scope') {
        options[name] = options[name] || {};
        options[name].generateScopedName = createScopedNameFunc(plugin);
      }

      if (name in options) {
        plugin = plugin(options[name]);
      } else {
        plugin = plugin.postcss || plugin();
      }

      return plugin;
    });
  }

  // keep track of css files visited
  var filenames = [];

  // keep track of all tokens so we can avoid duplicates
  var tokensByFile = {};

  // keep track of all source files for later builds: when
  // using watchify, not all files will be caught on subsequent
  // bundles
  var sourceByFile = {};

  browserify.transform(function transform (filename) {
    // only handle .css files
    if (!cssExt.test(filename)) {
      return through();
    }

    // collect visited filenames
    filenames.push(filename);

    return through(function noop () {}, function end () {
      var self = this;

      var loader = new FileSystemLoader(path.dirname(filename), plugins);

      // pre-populate the loader's tokensByFile
      loader.tokensByFile = tokensByFile;

      loader.fetch(path.basename(filename), '/').then(function (tokens) {
        var output = "module.exports = " + JSON.stringify(tokens);

        assign(tokensByFile, loader.tokensByFile);

        // store this file's source to be written out to disk later
        sourceByFile[filename] = loader.finalSource;

        self.queue(output);
        self.queue(null);
      }, function (err) {
        console.error(err);
      });
    });
  });

  // wrap the `bundle` function
  var bundle = browserify.bundle;
  browserify.bundle = function (opts, cb) {
    // reset the `tokensByFile` cache
    tokensByFile = {};

    // call the original
    var stream = bundle.apply(browserify, arguments);

    // close the css stream
    stream.on('end', function () {
      // Combine the collected sources into a single CSS file
      var css = Object.keys(sourceByFile).map(function(file) {
        return sourceByFile[file];
      }).join('\n');

      fs.writeFile(cssOutFilename, css, function(err) {
        if (err) console.error(err);
      });
    });

    return stream;
  };

  return browserify;
};
