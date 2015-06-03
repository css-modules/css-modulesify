local-css
====

A browserify transform allowing you to `require('styles.css')` and get back locally scoped classnames.

This is based on some ideas around [css-modules](http://github.com/css-modules), but not yet as fully-featured.

Why local css?
----

Normally you need to use a strict naming convention like BEM to ensure that one component's CSS doesn't collide with another's. Locally-scoped css allows you to use names that are meaningful within the context of the component, without any danger of name collision.

Read Mark Dalgleish's excellent ["End of Global CSS"](https://medium.com/seek-ui-engineering/the-end-of-global-css-90d2a4a06284) and check out [css-modules](http://github.com/css-modules) for more context.

Usage
----

First install the package: `npm install --save local-css`

Then you can use it as a browserify transform, eg: `browserify -t local-css example/index.js`

Inside `example/index.js` you can now load css into your scripts.  When you do `var box1 = require('./box1.css')`, `box1` will be an object to lookup the localized classname for one of the selectors in that file.

So to apply a class to an element you can do something like:

```js
var styles = require('./styles.css');
var div = `<div class="${styles.inner}">...</div>`;
```

To add the css to the html page there are 2 easy options:

- add the css to the DOM at runtime (good for component-based css): `require('insert-css')(require('./styles.css'))`
- export a static css file at build-time: `browserify -t local-css example/export-css.js | node > bundle.css`

Example
----

Take a look at the [example](./example/index.js) for more details, or [inspect the source](http://joshwnj.github.io/local-css/).


Licence
----

MIT


Thanks and inspiration
----

To all the fine folk working on [css-modules](https://github.com/css-modules)
