
var slice = Array.prototype.slice;
var splice = Array.prototype.splice;
var noop = function() {};
var isArray = Array.isArray;
var isObject = function(o) { return typeof o === 'object'; };
var isNode = function(o) { return o instanceof window.Node || o.nodeType > 0; };
var isString = function (o) { return Object.prototype.toString.call(o) === '[object String]'; };
var isNumber = function(o) { return !isNaN(parseFloat(o)); };
var toObject = function(key, value) { var x = {}; x[key] = value; return x; };
var mixin = function(object) {
  var copy = function(object, mixin) {
    Object.getOwnPropertyNames(mixin).forEach(function(prop) {
      object[prop] = mixin[prop];
    });
  };
  for (var i = 1, len = arguments.length; i < len; i++) copy(object, arguments[i]);
  return object;
};
var extend = function(parent, protoProps, staticProps) {
  // create a subclass
  var child = function() { this.constructor.apply(this, arguments); };
  child.extend = function(protoProps, staticProps) {
    return extend(this, protoProps, staticProps);
  };
  child.mixin = function(props) {
    mixin(this.prototype, props);
    return this;
  };
  child.prototype = Object.create(parent.prototype);
  if (protoProps) mixin(child.prototype, protoProps);
  if (staticProps) mixin(child, staticProps);
  return child;
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
  if (typeof a === 'object' && typeof b === 'object') {
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
var guid = (function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  return function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  };
})();

// EventEmitter mixin
var EventEmitter = {
  addEventListener: function(name, handler) {
    var events = this._events || (this._events = {});
    var handlers = this._events[name] || (this._events[name] = []);
    handlers.push(handler);
  },
  removeEventListener: function(name, handler) {
    var events = this._events || (this._events = {});
    var handlers = this._events[name];
    if (handlers) handlers.splice(handlers.indexOf(handler), 1);
  },
  trigger : function(name, arg) {
    if (!this._events) return this;
    arg = arg || {};
    (this._events[name] || []).forEach(function(h) { h(arg); });
    arg.event = name;
    (this._events.any || []).forEach(function(h) { h(arg); });
  }
};

// A Model is a JSON object that has a set() method which fires a change event
// You can extend a model to have custom methods if you wish
// It's up to you whether you use the get() method or not, which handles things like defaults and functions
var Model = extend(Object, {
  defaults: {},
  constructor: function(attr) {
    mixin(this, attr || {});
    this.init(attr);
  },
  init: function(attr) {},
  set: function(key, value) {
    var attr = arguments.length < 2 ? key : toObject(key, value);
    if (!this.isEqual(attr)) {
      mixin(this, attr);
      this.trigger('change', this);
    }
    return this;
  },
  isEqual: function(attr) {
    // Does deep equality comparison
    var changes = {};
    for (var key in attr) {
      var v1 = attr[key], v2 = this[key];
      if (!isEqual(v1, v2)) return false;
    }
    return true;
  },
  get: function(attr) {
    return this[attr] || this.defaults[attr];
  },
  toObject: function() {
    var res = {};
    Object.keys(this).forEach(function(key) { 
      res[key] = this[key];
    }.bind(this));
  }
}).mixin(EventEmitter);

// A collection holds an ordered? number of JSON objects and provides helper methods like add, remove, get, filter, etc.
// A collection also triggers a change event that a List can subscribe to directly
// A collection creates GUIDs (or auto-increments) for objects by default
var Collection = extend(Object, {
  idAttribute: 'id', 
  constructor: function(items) {
    this.reset(items);
  },
  count: function() {
    return this.items.length;
  },
  reset: function(items) {
    this.items = items || [];
    this.trigger('change');
  },
  setAll: function(items, key) {
    // smart set using add/remove and idAttribute
    if (this.items.length < 1) return this.reset(items);

    var PK = key || this.idAttribute;
    var prevItems = this.items;
    
    var id, len, item, newIDs = {}, prevIDs = {}, i = 0;

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
    return this.items[index];
  },
  set: function(index, value) {
    if (index instanceof Collection) return this.setAll(index.toArray(), value);
    if (isArray(index)) return this.setAll(index, value);
    if (isEqual(this.items[index], value)) return;
    this.items[index] = value;
    this.trigger('change', { updated: value, index: index });
    return this;
  },
  push: function(obj) {
    this.splice(this.items.length, 0, obj);
  },
  remove: function(index) {
    if (typeof index === 'object') index = this.find(index);
    this.splice(index, 1);
  },
  // find index of matching object, eg: find({ id: 1 });
  find: function(attr) {
    var idAttribute = this.idAttribute, items = this.items;
    var isEqual = Model.prototype.isEqual;

    for (var i = 0, len = items.length; i < len; i++) {
      if (isEqual.call(items[i], attr)) return i;
    }
    return -1;
  },
  splice: function(index) {
    var removed = splice.apply(this.items, arguments);
    var added = slice.call(arguments, 2);
    this.trigger('change', { added: added, removed: removed, index: index });
  },
  toArray: function() {
    return this.items;
  },
  forEach: function(fn) { return this.items.forEach(fn); },
  map: function(fn) { return this.items.map(fn); },
  filter: function(fn) { return this.items.filter(fn); }
}).mixin(EventEmitter);

var Controller = extend(Object, {
  refAttribute: 'ref',
  constructor: function(options) {
    mixin(this, options || {});
    this.model = (this.model instanceof Model) ? this.model : new Model(this.model);
    this.render = this.wrapRender(this.render).bind(this);
    this.setView = this.setView.bind(this);
    this.init(options);
    if (this.view) this.setView(this.view);
  },
  init: function() {}, // can override
  render: function() {}, // must override
  setView: function(view) {
    this.view = view;
    this._refs();
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
  set: function(model) {
    this.model.set(model);
    return this;
  },
  listenTo: function(obj, eventName, fn) {
    this._listeners = this._listeners || [];
    if (typeof obj.addEventListener !== 'function') throw "Can't listen to this object!";
    fn = fn.bind(this);
    obj.addEventListener(eventName, fn, false);
    this._listeners.push([ obj, eventName, fn ]);
    return this;
  },
  remove: function(view) {
    (this._includes || []).forEach(function(x) { x.remove(); });
    (this._listeners || []).forEach(function(x) { x[0].removeEventListener(x[1], x[2]); });
    if (this.view.parentNode && !view) this.view.parentNode.removeChild(this.view); // remove the view
  },
  include: function(controller, node) {
    this._includes = this._includes || [];
    this._includes.push(controller);
    if (node) controller.setView(node);
    return controller;
  },
  trigger: function(obj, name, e) {
    (this._listeners || []).forEach(function(x) {
      if (obj === x[0] && name === x[1]) x[2].call(this, e);
    });
  },
  wrapRender: function(fn) {
    return function() {
      var prev = this.DOM || {};
      var DOM = this.DOM = fn.call(this);
      var selector, props, prop, prevProps, node, value;

      if (typeof DOM !== 'object') return;
      for (selector in DOM) {
        props = DOM[selector];
        prevProps = prev[selector] || {};

        if (selector in this.ref) {
          // TODO handle CSS selectors?
          node = this.ref[selector];
          if (props instanceof Controller && prevProps !== props) {
            this.include(props, node); // it's an include
          } else {

            for (prop in props) {
              value = props[prop];
              if (prevProps[prop] !== value) { // process update if DOM Node has new property
                // handle events
                if (prop.substr(0,2) === 'on') {
                  var eventName = prop.substr(2).toLowerCase();
                  //node.addEventListener(eventName, value);
                  this.listenTo(node, eventName, value);
                  continue;
                }
                // handle everything else
                switch (prop) {
                  case 'text':
                    node.textContent = value; break;
                  case 'html':
                    node.innerHTML = value; break;
                  case 'visible':
                  case 'display':
                    node.style.display = value ? '' : 'none'; break;
                  case 'class':
                  case (typeof value === 'object'):
                    for (var className in value) {
                      if (value) node.classList.add(value[className]);
                      else node.classList.remove(value[className]);
                    } 
                    break;
                  default: node.setAttribute(prop, value);
                }
              }
            }
          }
        }
      }
      return DOM;
    };
  }
});

var List = extend(Controller, {
  // a collection is optional
  constructor: function(controller, collection) {
    this.controller = controller;
    this.collection = Array.isArray(collection || []) ? new Collection(collection) : collection;
    this.controllers = [];
    this.init();
  },
  init: function() {},
  controller: function(item) {
    throw "No controller generator specified!"; // this should be over-ridden
  },
  setView: function(view) {
    this.view = view;

    // if Controller is a class, set this.controller to a function that returns a new controller of that class
    // and use the first child element as the view
    if (typeof this.controller.prototype.remove === 'function') {
      this.controller = function(Controller, view, model) {
        return new Controller({ view: view.cloneNode(true), model: model });
      }.bind(this, this.controller, this.view.children[0].cloneNode(true));
    }

    this.listenTo(this.collection, 'change', this.onChange);
    this.render();
  },
  set: function(items) {
    this.collection.set(items);
    return this;
  },
  remove: function() {
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
    if (e.index === undefined) return this.render();
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

    this.controllers = this.collection.map(function(model) {
      return this.controller(model);
    }.bind(this));

    this.controllers.forEach(function(controller) {
      this.onAdd(view, controller);
    }.bind(this));

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
  Utils: {
    'mixin': mixin,
    'extend' : extend,
    'guid' : guid,
    'isEqual' : isEqual,
    'isNode' : isNode,
    'isNumber' : isNumber,
    'isArray' : isArray,
    'isString' : isString,
    'isObject' : isObject
  }
};
