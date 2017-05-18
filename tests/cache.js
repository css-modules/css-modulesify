var tape = require('tape');

var browserify = require('browserify');
var proxyquire = require('proxyquire');
var fs = require('fs');
var path = require('path');
var rebundler = require('rebundler');

var casesDir = path.join(__dirname, 'cases');
var simpleCaseDir = path.join(casesDir, 'simple');
var cssOutFilename = 'out.css';

tape('multiple builds', function (t) {
  var fakeFs = {
    writeFile: function (filename, content, cb) {
      var expected = fs.readFileSync(path.join(simpleCaseDir, 'expected.css'), 'utf8');

      t.equal(filename, cssOutFilename, 'correct output filename');
      t.equal(content, expected, 'output matches expected');
      cb();
    }
  };

  var cssModulesify = proxyquire('../', {
    fs: fakeFs
  });

  var cssModulesifyCache = {};
  var getBundler = rebundler(function (cache, packageCache) {
    return browserify(path.join(simpleCaseDir, 'main.js'), {
      cache: cache
    , packageCache: packageCache
    , fullPaths: true
    })
      .plugin(cssModulesify, {
        rootDir: path.join(simpleCaseDir)
        , output: cssOutFilename
        , cache: cssModulesifyCache
      });
  });

  getBundler().bundle(function (err) {
    t.error(err, 'initial bundle without a cache does not error');

    getBundler().bundle(function (err2) {
      t.error(err2, 'second pass bundle with a cache does not error');

      t.end();
    });
  });
});
