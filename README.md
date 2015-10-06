# exhibit-builder-concat [![NPM version][npm-image]][npm-url] [![Dependency Status][depstat-image]][depstat-url]

> [Exhibit.js](https://github.com/exhibitjs/exhibit) builder for concatenating adjacent scripts and stylesheets


## Installation

```sh
$ npm install --save-dev exhibit-builder-concat
```


## Usage

```js
exhibit('src')
  .use('concat')
  .build('dist');
```

You don't need to specify 'build blocks' like in Usemin/Useref. This builder *automatically* concatenates whatever it can – if two or more adjacent script elements (or stylesheet link elements) are found, with local URLs, they will be concatenated.


```html
<html>
  <head>
    <link rel="stylesheet" href="some/file.css">
    <link rel="stylesheet" href="another/file.css">
    <link rel="stylesheet" href="third/file.css">
    <link rel="stylesheet" href="http://example.com/some-external-file.css">
  </head>
  <body>
    <h1>demo</h1>

    <script src="http://jquery.com/jquery.js"></script>
    <script src="local-script.js"></script>
    <script src="another-local-script.js"></script>
  </body>
</html>
```

...turns into something like this:

```html
<html>
  <head>
    <link rel="stylesheet" href="concat-fw8dy7.css">
    <link rel="stylesheet" href="http://example.com/some-external-file.css">
  </head>
  <body>
    <h1>demo</h1>

    <script src="http://jquery.com/jquery.js"></script>
    <script src="concat-as8fgh.js"></script>
  </body>
</html>
```

Notes:

- 'Adjacent' means the tags have only whitespace or comments between them, nothing else.

- All incoming CSS and JS files coming into the builder are blocked from going through. But when an HTML file is passed in, the assets to be concatenated get imported and then output in concatenated bunches. So if you don't actually reference a given script/stylesheet from any HTML file, it will not make it through this builder.

- The output path names are in the form `concat-DIGEST.EXT`, where DIGEST is an MD5 digest of all the normalized URLs of the concatenated assets.

- In general, you should use this builder **after** any preprocessors and script bundlers, and just **before** JS/CSS minifiers.


## License

MIT


<!-- badge URLs -->
[npm-url]: https://npmjs.org/package/exhibit-builder-concat
[npm-image]: https://img.shields.io/npm/v/exhibit-builder-concat.svg?style=flat-square

[travis-url]: http://travis-ci.org/exhibitjs/exhibit-builder-concat
[travis-image]: https://img.shields.io/travis/exhibitjs/exhibit-builder-concat.svg?style=flat-square

[depstat-url]: https://david-dm.org/exhibitjs/exhibit-builder-concat
[depstat-image]: https://img.shields.io/david/exhibitjs/exhibit-builder-concat.svg?style=flat-square
