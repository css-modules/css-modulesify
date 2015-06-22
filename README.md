# css-modulesify

A browserify transform to load [CSS Modules].

[CSS Modules]: https://github.com/css-modules/css-modules

**Please note that this is still highly experimental.**

## Why CSS Modules?

Normally you need to use a strict naming convention like BEM to ensure that one component's CSS doesn't collide with another's. CSS Modules are locally scoped, which allows you to use names that are meaningful within the context of the component, without any danger of name collision.

Read Mark Dalgleish's excellent ["End of Global CSS"](https://medium.com/seek-ui-engineering/the-end-of-global-css-90d2a4a06284) and check out [css-modules](https://github.com/css-modules/css-modules) for more context.

## Usage

First install the package: `npm install --save css-modulesify`

Then you can use it as a browserify plugin, eg: `browserify -p [ css-modulesify -o dist/main.css ] example/index.js`

Inside `example/index.js` you can now load css into your scripts.  When you do `var box1 = require('./box1.css')`, `box1` will be an object to lookup the localized classname for one of the selectors in that file.

So to apply a class to an element you can do something like:

```js
var styles = require('./styles.css');
var div = `<div class="${styles.inner}">...</div>`;
```

The generated css will contain locally-scoped versions of any css you have `require`'d, and will be written out to the file you specify in the `--output` or `-o` option.

### PostCSS Plugins

The following PostCSS plugins are enabled by default:

  * [postcss-modules-local-by-default]
  * [postcss-modules-extract-imports]
  * [postcss-modules-scope]

(i.e. the [CSS Modules] specification).

You can supply your own additional PostCSS Plugins by passing `--use|-u` to `css-modulesify`.

In addion you may also wish to configure defined PostCSS plugins by passing `--plugin.option true`.

An example of this would be:

```
browserify -p [css-modulesify -u postcss-modules-local-by-default \
  -u postcss-modules-extract-imports \
  -u postcss-modules-scope \
  -u postcss-color-rebeccapurple \
  -u autoprefixer --autoprefixer.browsers '> 5%' \
  -o dist/main.css] -o dist/index.js src/index.js
```

[postcss-modules-local-by-default]: https://github.com/css-modules/postcss-modules-local-by-default
[postcss-modules-extract-imports]: https://github.com/css-modules/postcss-modules-extract-imports
[postcss-modules-scope]: https://github.com/css-modules/postcss-modules-scope

## Example

An example implementation can be found [here](https://github.com/css-modules/browserify-demo).

## Licence

MIT

## With thanks

 - Tobias Koppers
 - Mark Dalgleish
 - Glen Maddern

----
Josh Johnston, 2015.
