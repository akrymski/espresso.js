# Espresso.js

Espresso.js is a tiny MVC framework inspired by [Backbone](http://backbonejs.org) and [React](http://facebook.github.io/react/) with a focus on simplicity and speed.

We've aimed to bring the ideas of unidirectional data flow of [Flux](http://facebook.github.io/flux/docs/overview.html) to a simple, Backbone-style library.

### Features

- tiny, less than 500 lines and 3kb gzipped
- zero dependencies
- performance and memory focused
- does not aim to support anything below IE10, but may work on older browsers using a [shim](https://github.com/termi/ES5-DOM-SHIM)

### Getting Started

If you're using Browserify or Node/CommonJS, simply install the package:

```$ sudo npm install --save espresso.js```

Alternatively grab the [standalone version](https://raw.githubusercontent.com/techlayer/espresso.js/master/espresso.min.js?token=AAamF6ZPKrH6WZ5pN6wwM4QtQphAdmbLks5Ua2ecwA%3D%3D) that you can import with a `<script>` tag or checkout the [GitHub Repo](https://github.com/techlayer/espresso.js).

Now dive in and check out the [To-Do Example](https://github.com/techlayer/espresso.js/tree/master/examples/todomvc) app.

### Documentation

Backbone style docs can be found [here](https://rawgit.com/techlayer/espresso.js/master/docs/index.html)

### Testing

``` bash
$ mocha
```

### Building

If you need to use this module outside a CommonJS environment, 
you can build a standalone UMD module as follows:

``` bash
npm install -g uglify-js
npm install -g browserify

$ browserify espresso.js --standalone Espresso | uglifyjs > espresso.min.js
```

