var tape = require('tape');

var browserify = require('browserify');
var proxyquire = require('proxyquire');
var fs = require('fs');
var path = require('path');

var casesDir = path.join(__dirname, 'cases');
var cssOutFilename = 'out.css';

function runTestCase (dir) {
  tape('case: ' + dir, function (t) {
    // load (optional) custom setup for this testcase
    var customPath = path.join(casesDir, dir, 'custom.js');
    var customOpts;
    try {
      fs.accessSync(customPath);
      customOpts = require(customPath);
    } catch (e) {
      customOpts = {};
    }

    var fakeFs = {
      writeFile: function (filename, content, cb) {
        var expected = fs.readFileSync(path.join(casesDir, dir, 'expected.css'), 'utf8');

        t.equal(filename, cssOutFilename, 'correct output filename');
        t.equal(content, expected, 'output matches expected');
        cb();
      }
    };

    var cssModulesify = proxyquire('../', {
      fs: fakeFs
    });

    var b = browserify();

    b.add(path.join(casesDir, dir, 'main.js'));
    b.plugin(cssModulesify, Object.assign({}, {
      rootDir: path.join(casesDir, dir)
      , output: cssOutFilename
      , generateScopedName: cssModulesify.generateLongName
    }, customOpts));

    b.bundle(function (err) {
      if (err) {
        t.error(err, 'should not error');
      }

      t.end();
    });
  });
}

// test cases are expected to have:
// - main.js (entry point)
// - expected.css (what to expect from css-modulesify output)
// optional:
// - custom.js (module that exports an object of custom settings)

fs.readdirSync(path.join(__dirname, 'cases')).forEach(runTestCase);
