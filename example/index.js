var box1 = require('./box1.css');
var box2 = require('./box2.css');

var h = require('hyperscript');

// dynamically add the css to the browser (this could be done at build-time instead)
var insertCss = require('insert-css');
insertCss(box1);
insertCss(box2);

// create the markup and apply locally-scoped css classnames
var content = h('div', [
  h('p', 'This is a demonstration of using generic classnames in css files like `.box` and `.text`, without any danger of name collisions between components'),

  h('div', { className: box1['.box'] }, [
    h('p', { className: box1['.text'] }, 'Box 1')
  ]),

  h('div', { className: box2['.box'] }, [
    h('p', { className: box2['.text'] }, 'Box 2')
  ])
]);

document.getElementById('content').appendChild(content);
