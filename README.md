# exhibit-concat

> Exhibit plugin to automatically concatenate blocks adjacent of stylesheets and scripts.

## Usage

```js
exhibit('src')
  .use($.concat())
  .build('dist');
```

You don't need to specify 'build blocks' like in Usemin/Useref. Instead, any **local** scripts and stylesheet tags that are adjacent will be automatically concatenated. For example, this:

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

- All CSS and JS files coming into the plugin are blocked. But when an HTML file is passed in, the assets to be concatenated get imported and then output in concatenated bunches.

- The output path names are in the form `concat-DIGEST.EXT`, where DIGEST is an MD5 digest of all the normalized URLs of the concatenated assets.


## Licence

MIT
