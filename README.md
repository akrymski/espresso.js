# Espresso.js

Espresso.js is a tiny MVC library inspired by [Backbone](http://backbonejs.org) and [React](http://facebook.github.io/react/) with a focus on simplicity and speed.

We've aimed to bring the ideas of unidirectional data flow of [Flux](http://facebook.github.io/flux/docs/overview.html) to a simple, Backbone-style library.

### Features

- tiny, less than 500 lines and 3kb gzipped
- zero dependencies
- performance and memory focused
- does not aim to support anything below IE10, but may work on older browsers using a [shim](https://github.com/termi/ES5-DOM-SHIM)

### Documentation

Backbone-style docs can be found [here](http://krymski.com/espresso.js)

All documentation is automatically generated from `docs/index.md` using [Bocco](https://github.com/akrymski/bocco).

### Getting Started

If you're using Browserify or Node/CommonJS, simply install the package:

```$ sudo npm install --save espresso.js```

Alternatively grab the [standalone version](https://rawcdn.githack.com/akrymski/espresso.js/fc0f21d08810e95326431dbaa0f0a1cb6e3adec3/espresso.min.js) that you can import with a `<script>` tag or checkout the [GitHub Repo](https://github.com/akrymski/espresso.js).

Now dive in and check out the [To-Do Example](https://raw.githack.com/akrymski/espresso.js/master/examples/todomvc/index.html) app.

### Testing

``` bash
$ npm test
```

### Building

If you need to use this module outside a CommonJS environment, 
you can build a standalone UMD module as follows:

``` bash
$ npm run build
```

