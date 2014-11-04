# Web Framework

Simple framework based on Backbone, with clear MVC separation.  No dependency on jQuery or Underscore.  Focus on speed & simplicity.

### Benefits over Backbone

- tiny (less than 500 lines)
- zero dependencies
- much faster everything: view creation & updates, events, model change detection, etc.
- caching DOM nodes to reduce [layout thrashing](http://wilsonpage.co.uk/preventing-layout-thrashing/) and generally speed things up even more
- no templating/string interpolation - use the DOM Luke!
- garbage collection: no zombie views because of `include` mechanism
- declarative (or imperative) data binding between models <--> views
- proper `Collection.set` performs a smart update without relying on sorting
- built-in `List` class for displaying collections of models
- no support for IE < 9 (but may work with a shim)

## EventEmitter
EventEmitter serves as a mixin for Models & Collections and any other object you'd like Controllers to listen to.  The interface is intentionally the same as that for DOM Nodes.  We also add a trigger() event to Node prototype for conveniance.

### addEventListener(event, handler)
### removeEventListener(event, handler)
### trigger(event, data)

## Views
A view is a DOM Node.  For example:

    <div id="app-view">
      <input placeholder="Enter Your Name" />
      <h1>Howdy, <b ref="name" /><h1>
    </div>

Being a DOM node, there's no string interpolation to be done at runtime, nor does the browser need to parse the HTML from a string.  It also means designers can actually mockup a site which you can make interactive without messing with templating languages.

A `ref` is a special attribute that allows us to refer to that `node` by name in the `Controller`.  You can also use CSS selectors to refer to nodes, however they are **significantly** less efficient as a `querySelector` call needs to be made each time, and `matchesSelector` calls need to be made for event handling.

## Controllers

A controller is the mediator between model and view.  Example:

    var AppController = Controller.extend({
      init: function(options) {
        this.on(this.view, { 'keypress input' : 'name' });
        this.on(this.model, { 'change name' : 'text name' })({ changes: this.model.attributes });
      }
    });

The above is just shorthand for:

    var AppController = Controller.extend({
      init: function(options) {
        this.on(this.view, 'keypress', function(e) {
          if (e.target.matchesSelector('input')) this.model.set({ name: e.target.value });
        });
        this.on(this.model, 'change', function(e) {
          if (e.changes.name) this.ref.name.textContent = this.model.get('name');
        })({ changes: this.model.attributes });
      }
    });
        
### constructor(view, model, options)

    new AppController(document.body, { name: 'New App' }, { ... });

A `view` is a DOM node.  If a `string` is specified instead, then it is used to locate the DOM node by ID and clone its first child.  This is [much faster](http://jsperf.com/innerclone) than doing templating and parsing templates using `innerHTML`.
`model` can be an object or a Model instance.  `options` are optional and are passed to `init` function.

### init(options)
Gets called automatically by the constructor, and gets passed `options`.

### view
Refers to the view DOM Element

### model
Refers to the Model instance passed in

### include(controller, node)
Add child controllers and views:

    var page = this.include(new PageController('page-view', { name: 'Page 1' }), this.ref.page);
    
Note that the last parameter is optional, and specifies the DOM element that will be replaced with the view element.

### includes
An array of child controllers included with `include`

### ref
Object containing all DOM nodes with `ref` attribute, keyed by name.  Faster than doing `view.querySelector` as all nodes with `ref` attribute are fetched just once when the controller is initialised.

### remove
Removes the view and any included controllers, and removes any listeners attached with `on`

### on(object, event, handler)

The `on` method of the controller lets you listen to events raised by models and views, and automatically removes those listeners when the controller is removed.  The handler can be a function, or a hash:

    this.on(this.view, 'keypress', { input: function(e) { this.model.set({ name: e.target.value }); } }
    this.on(this.model, 'change', { name: function(e) { this.ref.input.value = e.changes.name; } });

The most common scenarios can be shortened to:

    this.on(this.view, 'keypress', { input: 'name' });
    this.on(this.model, 'change', { name: 'value input' });
    this.on(this.model, 'change', { name: 'text p' });   // set text content
    this.on(this.model, 'change', { name: 'html div' }); // set innerHTML
    this.on(this.model, 'change', { name: 'attr div' }); // set attribute attr
    this.on(this.model, 'change', { name: '.className div' }); // toggle class

Or even shorter:

    this.on(this.view, { 'keypress input' : 'name' });
    this.on(this.model, { 'change name' : 'value input' });

Only one event handler is ever created for any event type.  The handler function itself is returned which means it can be invoked on the leading edge.

## Models

### defaults
This property is used to set the default properties of the model

### set({ ... })
Sets new values on the model and fires a `change` event if necessary.

### get(property)
`property` can be a function name or attribute name

### toJSON(defaults_only=false)
returns the model attributes.  If passed true returns only the attributes in the defaults object.

### events
- `change` : has a `changes` attribute - an object with the attributes that have changed

## Collections

`Collections` are special types of models that contain arrays of other models and fire `add` `remove` and `reset` events that the controller can listen to.

### push, splice, indexOf, forEach, length
Same as Array methods

### remove(model)
Removes a model from the collection, calls splice.

### set([ ... ], key='id')
Sets the models in the collection, triggering `add` `remove` and `change` events as necessary.  Key is used as the primary key to establish if models should be added or removed, and defaults to `id`.

### reset([ ... ])
Reset the contents of the collection with new models, fires `reset` event.

## Lists

A `List` provides a simple way to display a `Collection` and keep it in sync with the DOM.  As you modify the collection the DOM gets auto-magically updated.

### constructor

    new List(view, collection, iterator)

The iterator is a function that returns a `Controller` instance or a DOM `Node` or an HTML `String`.

For example:

    var collection = [ { name: 'bob' }, { name: 'marley' } ];
    new List(document.body, collection, function(model, index) { 
      return new ItemController('item-view', model);
    });

If `item-view` is actually the first child of the list node, then the above can be shortened to:

    new List(document.body, collection, ItemController);

`Lists` are also useful where traditionally you'd use a for-loop inside a template:

    <ul ref="files">
      <% for-each file in files %><li class="file">{{ name }}</li><% endfor %>
    </ul>

Can be done as follows:

    new List(this.ref.files, files, function(name, index) {
      return '<li class="file">' + name +'</li>';
    });

## Code Guidelines

Use ES5 methods (plus a shim if necessary to support < IE9) such as this:

    for (var i = 0, len = arr.length; i < len; i++) { ... }

    Object.keys(obj).forEach(function(key) {
      var value = obj[key];
    });

    Object.create(prototype, methods);

## Libraries

Other libraries you may wish to use in conjunction with this framework:

DOM Manipulation:

    https://github.com/remy/min.js/blob/master/src/%24.js
    https://github.com/quilljs/quill/blob/master/src/lib/dom.coffee

Router:

    http://visionmedia.github.io/page.js/
    https://github.com/chrisdavies/rlite/blob/master/rlite.js
    https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Manipulating_the_browser_history

Ajax:

    https://github.com/substack/http-browserify
    https://github.com/visionmedia/superagent

Triggering DOM Events:

    https://github.com/adamsanderson/trigger-event/blob/master/index.js

Animation

    http://julian.com/research/velocity/
    http://impulse.luster.io

Static server:

    python -m SimpleHTTPServer 8080

