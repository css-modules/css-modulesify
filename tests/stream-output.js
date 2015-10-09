var tape = require('tape');

var browserify = require('browserify');
var proxyquire = require('proxyquire');
var fs = require('fs');
var path = require('path');

var casesDir = path.join(__dirname, 'cases');
var simpleCaseDir = path.join(casesDir, 'simple');
var cssFilesTotal = 1;
var cssOutFilename = 'out.css';

tape('stream output', function (t) {
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

  t.plan(cssFilesTotal * 2 + 1);

  var cssFilesCount = 0;
  browserify(path.join(simpleCaseDir, 'main.js'))
    .plugin(cssModulesify, {
      rootDir: path.join(simpleCaseDir)
    })
    .on('error', t.error)
    .bundle(function noop () {})
      .on('css stream', function (stream) {
        stream
          .on('data', function onData (css) {
            var cssString = css.toString();
            // just get the first class name, use that as an id
            var cssId = cssString.split('\n')[0].split(' ')[0];

            t.ok(
              ++cssFilesCount <= cssFilesTotal
            , 'emits data for ' + cssId
            );

            t.ok(
              cssString.indexOf('._styles') === 0
            , 'emits compiled css for ' + cssId
            );
          })
          .on('end', function onEnd () {
            t.pass('ends the stream');
          })
          .on('error', t.error);
      });
});
