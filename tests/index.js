var tape = require('tape');

var browserify = require('browserify');
var proxyquire = require('proxyquire');
var fs = require('fs');
var path = require('path');

var casesDir = path.join(__dirname, 'cases');
var cssOutFilename = 'out.css';

var globalCases = ['compose-node-module', 'compose-local-node-module', 'import-node-module'];

function runTestCase (dir) {
  tape('case: ' + dir, function (t) {
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
    b.plugin(cssModulesify, {
      rootDir: path.join(casesDir, dir)
      , output: cssOutFilename
      , generateScopedName: cssModulesify.generateLongName

      // only certain cases will use a global transform
      , global: globalCases.indexOf(dir) !== -1
    });

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
fs.readdirSync(path.join(__dirname, 'cases')).forEach(runTestCase);
