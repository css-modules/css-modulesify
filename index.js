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
  return function (name, filename, css) {
    var hash = stringHash(css).toString(36).substr(0, 5);
    return orig.apply(plugin, arguments) + '___' + hash;
  };
}

/*

  Normalize the manifest paths so that they are always relative
  to the project root directory.

*/
function normalizeManifestPaths (tokensByFile, rootDir) {
  var output = {};
  var rootDirLength = rootDir.length + 1;

  Object.keys(tokensByFile).forEach(function (filename) {
    var normalizedFilename = filename.substr(rootDirLength);
    output[normalizedFilename] = tokensByFile[filename];
  });

  return output;
}

var cssExt = /\.css$/;

// caches
//
// persist these for as long as the process is running. #32

// keep track of css files visited
var filenames = [];

// keep track of all tokens so we can avoid duplicates
var tokensByFile = {};

// keep track of all source files for later builds: when
// using watchify, not all files will be caught on subsequent
// bundles
var sourceByFile = {};

module.exports = function (browserify, options) {
  options = options || {};

  // if no root directory is specified, assume the cwd
  var rootDir = options.rootDir || options.d;
  if (rootDir) { rootDir = path.resolve(rootDir); }
  if (!rootDir) { rootDir = process.cwd(); }

  var cssOutFilename = options.output || options.o;
  if (!cssOutFilename) {
    throw new Error('css-modulesify needs the --output / -o option (path to output css file)');
  }

  var jsonOutFilename = options.json || options.jsonOutput;

  // PostCSS plugins passed to FileSystemLoader
  var plugins = options.use || options.u;
  if (!plugins) {
    plugins = Core.defaultPlugins;
  }
  else {
    if (typeof plugins === 'string') {
      plugins = [plugins];
    }
  }

  var postcssAfter = options.postcssAfter || options.after || [];
  plugins = plugins.concat(postcssAfter);

  // load plugins by name (if a string is used)
  plugins = plugins.map(function requirePlugin (name) {
    // assume functions are already required plugins
    if (typeof name === 'function') {
      return name;
    }

    var plugin = require(require.resolve(name));

    // custom scoped name generation
    if (name === 'postcss-modules-scope') {
      options[name] = options[name] || {};
      if (!options[name].generateScopedName) {
        options[name].generateScopedName = createScopedNameFunc(plugin);
      }
    }

    if (name in options) {
      plugin = plugin(options[name]);
    }
    else {
      plugin = plugin.postcss || plugin();
    }

    return plugin;
  });

  function transform (filename) {
    // only handle .css files
    if (!cssExt.test(filename)) {
      return through();
    }

    // collect visited filenames
    filenames.push(filename);

    var loader = new FileSystemLoader(rootDir, plugins);
    return through(function noop () {}, function end () {
      var self = this;

      loader.fetch(path.relative(rootDir, filename), '/').then(function (tokens) {
        var output = 'module.exports = ' + JSON.stringify(tokens);

        assign(tokensByFile, loader.tokensByFile);

        // store this file's source to be written out to disk later
        sourceByFile[filename] = loader.finalSource;

        self.queue(output);
        self.queue(null);
      }, function (err) {
        browserify.emit('error', err);
      });
    });
  }

  browserify.transform(transform, {
    global: true
  });

  browserify.on('bundle', function (bundle) {
    bundle.on('end', function () {
      // Combine the collected sources into a single CSS file
      var css = Object.keys(sourceByFile).map(function (file) {
        return sourceByFile[file];
      }).join('\n');

      fs.writeFile(cssOutFilename, css, function (err) {
        if (err) {
          browserify.emit('error', err);
        }
      });

      // write the classname manifest
      if (jsonOutFilename) {
        fs.writeFile(jsonOutFilename, JSON.stringify(normalizeManifestPaths(tokensByFile, rootDir)), function (err) {
          if (err) {
            browserify.emit('error', err);
          }
        });
      }

      // reset the `tokensByFile` cache
      tokensByFile = {};
    });
  });

  return browserify;
};
