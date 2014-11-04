# Contributing Guide

## Pull Request Checklist

* Before you open a ticket or send a pull request, search for previous
discussions about the same feature or issue. Add to the earlier ticket if you
find one.

* Before sending a pull request for a feature or bug fix, be sure to have tests

* Use the same coding style as the rest of the codebase

* In your pull request, do not add documentation or rebuild the minified
`X-min.js` file. We'll do that before cutting a new release.

* All pull requests should be made to the `master` branch.

## Code Style

- [No semicolons unless necessary](http://inimino.org/~inimino/blog/javascript_semicolons).
- 2 spaces indentation.
- Single var definition, align equal signs where possible.
- Return early in one line if possible.

## Testing

``` bash
$ mocha
```

## Building

If you need to use this module outside a CommonJS environment, 
you can build a standaline UMD module as follows:

``` bash
npm install -g uglify-js
npm install -g browserify

$ browserify espresso.js --standalone espresso | uglifyjs > espresso.min.js
```
