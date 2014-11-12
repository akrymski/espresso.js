var animate = window.requestAnimationFrame || function(cb) { window.setTimeout(cb, 0); };
var slice = Array.prototype.slice;
var splice = Array.prototype.splice;
var noop = function() {};
var isUndefined = function(arg) { return arg === void 0 };
var isFunction = function(x) { return typeof x === 'function' };
var isNumber = function(x) { return typeof x === 'number' };
var isObject = function(x) { return typeof x === 'object' && x !== null };
var isString = function(x) { return typeof x === 'string' };
var isNode = function(x) { return x && x.nodeType > 0 };
var isArray = Array.isArray;
var toObject = function(key, val) { var x = {}; x[key] = val; return x };
var assign = function(o) {
  for (var i = 1, a = arguments, len = a.length; i < len; i++) {
    for (var prop in a[i]) if (a[i].hasOwnProperty(prop)) o[prop] = a[i][prop];
  }
  return o;
};
var extend = function(parentClass, props) {
  var child = function() { this.constructor.apply(this, arguments) }
  child.extend = function(props) { return extend(this, props) }
  child.prototype = Object.create(parentClass.prototype)
  if (props) assign.apply(this, [ child.prototype ].concat(slice.call(arguments, 1)))
  return child
};
var isEqual = function(a, b) {
  if (a === b) return true;
  var i, len, key;
  if (isArray(a)) {
    if (!isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (i = 0, len = a.length; i < len; i++) {
      if (!isEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (isObject(a) && isObject(b)) {
    var aKeys = Object.keys(a), bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (i = 0, len = aKeys.length; i < len; i++) {
      key = aKeys[i];
      if (!isEqual(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
};
var getView = function(name) {
  var cache = window._view_cache || (window._view_cache = {});
  var view = cache[name] || (cache[name] = document.getElementById(name));
  return view.cloneNode(true);
}
var EventEmitter = {
  addListener: function(name, fn) {
    var listeners = this._listeners || (this._listeners = {});
    var handlers = listeners[name] || (listeners[name] = []);
    handlers.push(fn);
  },
  removeListener: function(name, fn) {
    var listeners = (this._listeners || {})[name];
    if (listeners) listeners.splice(listeners.indexOf(fn), 1);
  },
  emit : function(name) {
    var listeners = (this._listeners || {})[name];
    if (listeners) {
      var args = slice.call(arguments, 1);
      listeners.forEach(function(h) { h.apply(this, args); }.bind(this));
    }
  }
};

// A Model is a JSON object that has a set() method which fires a change event
// You can extend a model to have custom methods if you wish
// It's up to you whether you use the get() method or not, which handles things like defaults and functions
var Model = extend(Object, EventEmitter, {
  defaults: {},
  constructor: function(attr) {
    assign(this, attr || {});
    this.init(attr);
  },
  init: noop,
  set: function(key, value) {
    var attr = arguments.length < 2 ? key : toObject(key, value);
    if (!this.isEqual(attr)) {
      assign(this, attr);
      this.emit('change', this);
    }
    return this;
  },
  isEqual: function(attr) {
    for (var key in attr) {
      if (!isEqual(attr[key], this[key])) return false;
    }
    return true;
  },
  get: function(attr) {
    return this[attr] || this.defaults[attr];
  },
  toObject: function() {
    return assign({}, this);
  }
})

// A collection holds an ordered number of Objects and provides helper methods like add, remove, get, filter, etc.
// A collection also triggers a change event that a List can subscribe to directly
// A collection creates GUIDs (or auto-increments) for objects by default
var Collection = extend(Object, EventEmitter, {
  idAttribute: 'id', 
  constructor: function(items) {
    this.reset(items);
    this.init();
  },
  init: noop,
  count: function() {
    return this.items.length;
  },
  reset: function(items) {
    this.items = isArray(items) ? items.slice(0) : [];
    this.emit('change');
  },
  _setAll: function(items, key) {
    // smart set using add/remove and idAttribute
    if (this.items.length < 1) return this.reset(items);

    var PK = key || this.idAttribute;
    var prevItems = this.items;
    
    var id, len, item, newIDs = {}, i = 0;

    // get IDs of new models
    items.forEach(function(x, i) { newIDs[x[PK]] = i; });

    // Remove models that arent in new collection
    while (i < prevItems.length) {
      id = prevItems[i][PK];
      if (newIDs.hasOwnProperty(id)) i++;
      else this.splice(i, 1);
    }

    // Add or update models
    for (i = 0, len = items.length; i < len; i++) {
      item = prevItems[i];
      id = items[i][PK];

      if (item && item[PK] === id) {
        this.set(i, items[i]);
      } else {
        // remove existing model with that ID
        for (var j = i + 1, len2 = prevItems.length; j < len2; j++) {
          if (prevItems[i][PK] === id) this.splice(j, 1);
        }
        // add the new model in the correct place
        this.splice(i, 0, items[i]);
      }
    }

    return this;
  },
  get: function(index) {
    return isObject(index) ? this.find(index) : this.items[index];
  },
  // set(index, value)
  // set([ new values ])
  // set({ id: 1, attr: 2 }) - update
  set: function(index, value) {
    if (index instanceof Collection) index = index.toArray();
    if (isArray(index)) return this._setAll(index, value);
    if (isUndefined(value) && isObject(index)) {
      var i = this.findIndex(toObject(this.idAttribute, index[this.idAttribute]));
      if (i < 0) return;
      value = assign({}, this.items[i], index);
      index = i;
    }
    if (isEqual(this.items[index], value)) return;

    this.items[index] = value;
    this.emit('change', { updated: value, index: index });
    return this;
  },
  push: function(obj) {
    for (var i = 0, len = arguments.length; i < len; i++) {
      this.splice(this.items.length, 0, arguments[i]);
    }
    return this.items.length;
  },
  remove: function(index) {
    if (isObject(index)) index = this.findIndex(index);
    this.splice(index, 1);
  },
  find: function(x, y, z) {
    return this.get(this.findIndex.call(this, x, y, z));
  },
  // find index of matching object, eg: findIndex({ id: 1 });
  findIndex: function(attr) {
    var items = this.items, isEqual = Model.prototype.isEqual, id;
    if (this.idAttribute in attr) id = this.idAttribute;
    for (var i = 0, len = items.length; i < len; i++) {
      if (id) {
        if (attr[id] === items[i][id]) return i;
      } else if (isEqual.call(attr, items[i])) return i;      
    }
    return -1;
  },
  splice: function(index) {
    var removed = splice.apply(this.items, arguments);
    var added = slice.call(arguments, 2);
    this.emit('change', { added: added, removed: removed, index: index });
    return removed;
  },
  toArray: function() {
    return this.items;
  },
  indexOf: function(x) { return this.items.indexOf(x) },
  forEach: function(fn) { return this.items.forEach(fn) },
  map: function(fn) { return this.items.map(fn) },
  filter: function(fn) { return this.items.filter(fn) }
});

var Controller = extend(Object, EventEmitter, {
  refAttribute: 'data-ref',
  constructor: function(options) {
    assign(this, options || {});
    this.model = (this.model instanceof Model) ? this.model : new Model(this.model);
    this.render = this._wrap(this.render).bind(this);
    this.setView = this.setView.bind(this);
    if (this.view) this.setView(this.view);
  },
  init: noop, // can override
  render: noop, // must override
  setView: function(view) {
    if (isString(view)) view = getView(view);
    this.view = view;
    this._refs();
    this.init();
    this.render();
    this.listenTo(this.model, 'change', this.render);
  },
  _refs: function() {
    var refs = this.view.querySelectorAll('[' + this.refAttribute + ']');
    var ref = this.ref = {};
    for (var i = 0, len = refs.length; i < len; i++) {
      ref[refs[i].getAttribute(this.refAttribute)] = refs[i];
    }
    ref.view = this.view;
  },
  set: function(attrs) {
    this.model.set(attrs);
    return this;
  },
  listenTo: function(obj, eventName, fn) {
    this._listenTo = this._listenTo || [];
    var on = obj.addEventListener || obj.addListener || obj.on;
    if (!isFunction(on)) throw "Can't listen to this object!";
    fn = fn.bind(this);
    on.call(obj, eventName, fn, false);
    this._listenTo.push([ obj, eventName, fn ]);
    return this;
  },
  stopListening: function(obj, eventName) {
    (this._listenTo|| []).forEach(function(x) {
      if (!isUndefined(obj) && obj !== x[0]) return;
      if (!isUndefined(eventName) && eventName !== x[1]) return;

      var removeListener = x[0].removeEventListener || x[0].removeListener || x[0].off;
      removeListener(x[1], x[2]);
    }.bind(this));
  },
  remove: function(node) {
    this.stopListening();
    (this._includes || []).forEach(function(x) { x.remove(); });
    if (node === false) return; // dont remove the node
    if (this.view.parentNode) this.view.parentNode.removeChild(this.view);
  },
  include: function(controller, node) {
    this._includes = this._includes || [];
    this._includes.push(controller);
    if (node) controller.setView(node);
    return controller;
  },
  setAttribute: function(node, attr, value) {
    if (attr === 'text') node.textContent = value || '';
    else if (attr === 'html') node.innerHTML = value || '';
    else if (attr === 'display') node.style.display = value ? '' : 'none';
    else if (attr === 'checked') node.checked = value;
    else if (attr === 'classList') {
      for (var className in value) {
        if (value[className]) node.classList.add(className);
        else node.classList.remove(className);
      } 
    } else if (attr.substr(0,2) === 'on') {
      var eventName = attr.substr(2).toLowerCase();
      this.listenTo(node, eventName, function(fn, e) {
        if (fn.call(this, e) === false && e.preventDefault) e.preventDefault();
      }.bind(this, value));
    } else node.setAttribute(attr, value);
  },
  _wrap: function(fn) {
    return function() {
      var set = this.setAttribute, refs = this.ref, include = this.include;
      var prev = this.DOM || {};
      var next = this.DOM = fn.call(this);
      if (!isObject(next)) return;

      animate(function() {
        for (var ref in next) {
          var node = refs[ref];
          if (isUndefined(node)) throw "Invalid data-ref name specified";
          var nextNode = next[ref], prevNode = prev[ref] || {};

          if (nextNode instanceof Controller) {
            if (nextNode !== prevNode) include(nextNode, node);
            continue;
          }
          
          for (var attr in nextNode) {
            var value = nextNode[attr];
            if (value !== prevNode[attr]) set.call(this, node, attr, value);
          }
        }
      }.bind(this))
      
      return next;
    }
  }
});

var List = extend(Controller, {
  // a collection is optional
  constructor: function(controller, collection) {
    this.controller = controller;
    this.collection = Array.isArray(collection || []) ? new Collection(collection) : collection;
    this.controllers = [];
  },
  controller: function() {
    throw "No controller generator specified!"; // this should be over-ridden
  },
  setView: function(view) {
    this.view = view;

    // if Controller is a class, set this.controller to a function that returns a new controller of that class
    // and use the first child element as the view
    if (isFunction(this.controller.prototype.remove)) {
      this.controller = function(Controller, view, model) {
        return new Controller({ view: view.cloneNode(true), model: model });
      }.bind(this, this.controller, this.view.children[0].cloneNode(true));
    }

    this.init();
    this.render();
    this.listenTo(this.collection, 'change', this.onChange);
  },
  set: function(items) {
    this.collection.set(items);
    return this;
  },
  reset: function(items) {
    this.collection.reset(items);
    return this;
  },
  remove: function() {
    this.stopListening();
    this.controllers.forEach(this.onRemove);
  },
  onAdd: function(view, controller, index) {
    view.insertBefore(controller.view, view.childNodes[index]);
  },
  onUpdate: function(controller, model) {
    controller.set(model); // update model and render
  },
  onRemove: function(controller) {
    controller.remove();
  },
  onChange: function(e) {
    if (isUndefined(e) || isUndefined(e.index)) return this.render();
    if (e.updated) return this.onUpdate(this.controllers[e.index], e.updated);

    var added = e.added.map(this.controller);
    var removed = splice.apply(this.controllers, [].concat(e.index, e.removed.length, added));
    removed.forEach(this.onRemove);

    for (var i = 0, len = added.length; i < len; i++) {
      this.onAdd(this.view, added[i], e.index + i);
    }
  },
  render: function() {
    // render into a documentFragment for speed
    var view = document.createDocumentFragment();
    var oldControllers = this.controllers;
    this.controllers = this.collection.map(this.controller);
    this.controllers.forEach(this.onAdd.bind(this, view));
    this.view.innerHTML = '';
    this.view.appendChild(view);
    oldControllers.forEach(this.onRemove);
  },
});

module.exports = {
  EventEmitter : EventEmitter,
  Model : Model,
  Collection : Collection,
  Controller : Controller,
  List: List,
  assign: assign,
  extend: extend,
  isEqual: isEqual
}
