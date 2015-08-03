var tape = require('tape');

var browserify = require('browserify');
var proxyquire = require('proxyquire');
var fs = require('fs');
var path = require('path');

var casesDir = path.join(__dirname, 'cases');
var cssOutFilename = 'out.css';

// test cases are expected to have:
// - main.js (entry point)
// - expected.css (what to expect from css-modulesify output)
fs.readdirSync(path.join(__dirname, 'cases')).forEach(runTestCase);

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
      output: cssOutFilename
    });

    b.bundle(function (err, buf) {
      if (err) {
        console.error(err);
        return t.fail('Unexpected error');
      }

      t.end();
    });
  });
}
