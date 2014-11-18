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

## Views
A view is a DOM Node.  For example:

```
<div class="commentBox">
  <h1>Comments</h1>
  <div data-ref="commentList"> 
      <div data-ref="comment">
          <a style="float:right" href="#" data-ref="remove">[x]</a>
          <h2 data-ref="author"></h2>
          <span data-ref="html"></span>
      </div>
  </div>
</div>
```

Being a DOM node, there's no string interpolation to be done at runtime, nor does the browser need to parse the HTML from a string.  It also means designers can actually mockup a site which you can make interactive without messing with templating languages.

### data-ref

A `data-ref` is a special attribute that allows us to refer to that `node` by name in the `Controller`.  

## Controllers

A controller is the mediator between model and view.  You can extend the controller using tranditional JavaScript prototype inheritance, or use the built-in `extend` method:

```
var Comment = Espresso.Controller.extend({
  init: function(options) { ... }
})
```
        
### constructor `new Controller(options)`

Options over-ride anything defined on the class.

If `options.view` is a DOM node, then the controller is bound to that node.

If `options.view` is a `string`, then it is used to locate the DOM node by ID and clone its first child.  This is [much faster](http://jsperf.com/innerclone) than doing templating and parsing templates using `innerHTML`.

### init `init(options)`
Gets called automatically as soon as the controller is bound to a view, and gets passed `options`.

### ref
Object containing all DOM nodes with `data-ref` attribute, keyed by name.  Faster than doing `view.querySelector` as all nodes with `ref` attribute are fetched just once when the controller is initialised.

    this.ref.author.textContent = 'hello world'

Note that for convenience, ref.view refers to controller's DOM node.

### view
The view property refers to the view DOM Element

### model
Model property refers to the Model instance backing the controller.  Whenever the model changes, the controller's `render` method is called automatically.

### include `include(controller, [view])`
Add child controllers and views:

    var page = this.include(new PageController({ view: 'page-view', name: 'Page 1' }), this.ref.page);

If a `view` node is specified, the child controller will have its view set to that node at the same time.

### remove `remove()`
Removes the view and any included controllers, and removes any listeners attached with `listenTo`

### listenTo `listenTo(object, event, fn)`

The `listenTo` method of the controller lets you listen to events raised by other objects:

    this.listenTo(this.model, 'change', function() { ... })
    this.listenTo(document.body, 'click', function() { ... })

Target objects must provide on of the following method forms: `addListener` `addEventListener` `on`.
The callback function is automatically bound to the controller for you, so `this` should refer to the controller instance unless you bind it to something else ahead of time.

### stopListening `stopListening(object, event)`
Stops listening to particular object and/or event.

### setView `setView(node)`
`setView` is called automatically as soon as the controller has a view specified either in the constructor options or when it's being included in `render`.  The function computers the `ref` property, calls `init`, `render` and then listens to model changes.

You should not need to call `setView` manually.

### set `set({ key: val })`
Shortcut for `this.model.set`

### render
You should over-ride render with your own implementation that updates `this.view` node.  You can do this imperatively as in Backbone, or declaratively as follows:

    render: function() {
      return {
        list: this.list.set(items),
        view: { classList: { editing: this.model.editing, completed: this.model.done } },
        label: { onclick: this.edit, text: 'click here', display: true },
        input: { value: this.model.text, onkeydown: this.key },
        toggle: { onclick: this.toggle, checked: this.model.done }
        count: { html: '<strong>'+store.active().length+'</strong> items left' },
      }
    }

If your render function returns an `Object`, Espresso assumes that the object represents current state of `this.view` and peforms the required updates to the DOM after diff-ing against previous DOM object returned by `render`.  The declarative form specifies the name of the node on the left (as per the `data-ref` property) and attributes of that node on the right.  If the name maps to a controller instance, the controller is added as a **child** with that node as its `view`.  Apart from HTML attributes, some attributes offer special features:

- `on[event]` - binds an event handler to that node
- `classList: { className: true|false }` - specifies which *classes* the node should have
- `display: true|false` - whether to display the node
- `text` - sets the textContent of the node
- `html` - sets the innerHTML content of the node
- `checked` - sets the checked value of a checkbox

## Models
Models are thin wrappers over objects providing getters and setters and firing `change` events.  Note that getters are optional (if you wish to make use of the `defaults`) but `set` must be called in order to fire a `change` event.

### constructor `new Model({ key: val })`
Creates a new model with specified attributes

### defaults
This property is used to set the default properties of the model, which are used when `get` is called.

### set `set({ key: val }); set(key, val)`

Sets new values on the model and fires a `change` event if necessary.  Since changing the model will cause the controller to re-render, you should aim to set all required properties in one `set()` call.

### get `get(attr)`
`attr` can be a function name or attribute name

### toObject
returns the model attributes as a pure object.

## Collections
Collections are thin wrappers over native arrays and fire a `change` method when they have been modified.  The `change` method specifies the `index` and which elements have been added, removed and updated.

    this.listenTo(collection, function(e) {
      console.log(e.index, e.added, e.removed, e.updated)
    })


### constructor `new Collection([ .. ])`
Creates a new collection with specified items

### idAttribute `defaults to "id"`
This property is used to find and update items by their primary key.

### count `count()`
Returns the number of items in the collection

### get `get(index); get({ id: 1 })`
Returns an item from the collection at the specified index or matching the given object

### set `set(index, item)`
Sets an item in the collection.  Alternatively an item in the collection with `id = 1` can be updated as follows:

```
set({ id: 1, value: 2 })
```

Or you can set all items in the collection as follows:

```
set([ ... ], [idAttribute])
```

which performs a *smart update* of the collection by performing `splice` operations in order to arrive at the target set.

### reset `reset([ ... ])`
Resets all the items in the collection.

### findIndex `findIndex({ id: 1 })`
Returns the index of matching item in the collection or `-1`

### find `find({ id: 1})`
Returns the matching item in the collection or `undefined`

### remove `remove(index); remove({ id: 1 })`
Removes an item from the collection

### Array methods
Available array methods are:

- push
- splice
- indexOf
- forEach
- map
- filter

## Lists

A `List` provides a simple way to display an array of objects, and updates the DOM as necessary when objects are added, removed or updated.

### constructor `new List(ControllerClass, [items])`

Creates a new list of type `ControllerClass`, using each `item` as the model for the controller.  `ControllerClass` can also be a function that returns a controller `instance`:

    new List(ToDoItem)
    new List(function(model) { new ToDoItem({ model: model }) })

If `items` are passed in, they are used as the default items in the list.  `items` can also be an instance of a `Collection` class, in which the list binds directly to that collection.

### set `set([ ... ])`
Sets the items in the list, and returns the list.

    render: function() {
      init: function() {
        this.todos = [ { text: 'shop' }, { text: 'code' } ]
        this.list = new List(ToDoItem)
      }
      return {
        todos: this.list.set(this.todos)
      }
    }

### reset `reset([...])`
Delegates to `Collection.reset`

## EventEmitter
All classes mixin the `EventEmitter`, which is a tiny implementation of node's [equivalent module](http://nodejs.org/api/events.html).

### addListener `addListener(event, fn)`
### removeListener `removeListener(event, fn)`
### emit `emit(event, [arg1], [arg2])`

## Examples

### Comments

A [comments example](https://github.com/techlayer/espresso.js/tree/master/examples/comments) based on the [React tutorial](http://facebook.github.io/react/docs/tutorial.html)

### ToDoMVC

A simple [to-do example](https://github.com/techlayer/espresso.js/tree/master/examples/todomvc) in 130 lines based on [ToDoMVC](http://todomvc.com/)

