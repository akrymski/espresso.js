# Espresso.js

A tiny MVC framework with a focus on speed & simplicity.

### Features

- tiny (less than 500 lines)
- zero dependencies
- performance and memory focused
- does not aim to support anything below IE10, but may work on older browsers using a [shim](https://github.com/termi/ES5-DOM-SHIM)

- caching DOM nodes to reduce [layout thrashing](http://wilsonpage.co.uk/preventing-layout-thrashing/) and generally speed things up even more
- no templating/string interpolation - use the DOM Luke!
- garbage collection: no zombie views because of `include` mechanism
- declarative (or imperative) data binding between models <--> views
- proper `Collection.set` performs a smart update without relying on sorting
- built-in `List` class for displaying collections of models
- no support for IE < 9 (but may work with a shim)

## EventEmitter
All classes in espresso.js inherit from `EventEmitter`, which is a tiny implementation of node's [equivalent module](http://nodejs.org/api/events.html).

### addListener(event, handler)
### removeListener(event, handler)
### emit(event, [arg1], [arg2])

## Views
A view is a DOM Node.  For example:

    <div id="app-view">
      <input placeholder="Enter Your Name" />
      <h1>Howdy, <b data-ref="name" /><h1>
    </div>

Being a DOM node, there's no string interpolation to be done at runtime, nor does the browser need to parse the HTML from a string.  It also means designers can actually mockup a site which you can make interactive without messing with templating languages.

A `data-ref` is a special attribute that allows us to refer to that `node` by name in the `Controller`.  

## Controllers

A controller is the mediator between model and view.  Example:

    var App = Controller.extend({
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

    new List(iterator, [collection])

The `iterator` can one of the following:

- a class that inherits from `Controller`
- a function that returns a `Controller` instance
- a function that returns a DOM `Node` or an HTML `String`


