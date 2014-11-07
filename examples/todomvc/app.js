// todomvc
var Espresso    = window.Espresso
var Model       = Espresso.Model
var Collection  = Espresso.Collection
var Controller  = Espresso.Controller
var List        = Espresso.List
var extend      = Espresso.extend
var $           = function(x) { return document.getElementById(x) }
var ENTER_KEY   = 13;
var ESC_KEY     = 27;

var ToDoCollection = extend(Collection, {
    init: function() {
        this.clearCompleted = this.clearCompleted.bind(this);
        this.reset(JSON.parse(localStorage.getItem('todo')));
    },   
    toggle: function(id, done) {
        var index = this.index(id);
        var item = this.get(index);
        this.set(index, { done: done, id: item.id, text: item.text })
    },
    toggleAll: function(done) {
        this.forEach(function(v, i) {
            if (v.done !== done) {
                this.set(i, { done: done, text: v.text, id: v.id })
            }
        }.bind(this))
    },
    clearCompleted: function() {
        var done = [];
        this.forEach(function(v, i) {
            if (v.done) done.push(i)
        }.bind(this))
        done.forEach(this.remove.bind(this))
    },
    completed: function() {
        var completed = 0;
        this.forEach(function(v) { if (v.done) completed++ }.bind(this));
        return completed;
    },
    save: function() {
        localStorage.setItem('todo', JSON.stringify(this.toArray()));
    }
});

var ToDoItem = extend(Controller, {
    init: function() {
        this.listenTo(window, 'click', function(e) {
            if (this.model.editing && e.target !== this.ref.input) {
                this.set({ editing: false });
            }
        });
    },
    edit: function() {
        this.ref.input.focus();
        this.set({ editing: true });
    },
    destroy: function() {
        items.remove({ id: this.model.id });
    },
    key: function(e) {
        if (e.which === ENTER_KEY) this.set({ editing: false, text: e.target.value });
        else if (e.which === ESC_KEY) {
            this.set({ editing: false });
            e.target.value = this.model.text;
        }
    },
    toggle: function(e) {
        items.toggle(this.model.id, e.target.checked);
    },
    render: function() {
        return {
            view: { 'class': { editing: this.model.editing, completed: this.model.done } },
            label: { ondblclick: this.edit, text: this.model.text },
            destroy: { onclick: this.destroy },
            input: { value: this.model.text, onkeydown: this.key },
            toggle: { onclick: this.toggle, checked: this.model.done }
        }
    }
});

var App = extend(Controller, {
    init: function() {
        this.model.count = 0;
        this.list = new List(ToDoItem, []);
        this.listenTo(items, 'change', function() {
            this.set({ count: items.count() - items.completed() });
            items.save();
        });
        this.listenTo($('filters'), 'click', function(e) {
            if (e.target.nodeName === 'A') this.filter(e.target.innerHTML.toLowerCase())
        });
        this.filter('all');
    },
    filter: function(name) {
        var filtered = items.filter(function(v) {
            if (name === 'completed' && !v.done) return false;
            if (name === 'active' && v.done) return false;
            return true;
        });
        this.list.set(filtered);
    },
    addItem: function(e) {
        if (e.which !== ENTER_KEY) return;
        items.push({ done:false, text:this.ref.newItem.value, id: items.count() })
        this.ref.newItem.value = '';
    },
    toggleAll: function(e) {
        items.toggleAll(e.target.checked);
    },
    clearText: function() {
        var x = items.count() - this.model.count
        return 'Clear completed (' + x + ')'
    },
    render: function() {
        return {
            footer: { display: items.count() > 0 },
            clear: { text: this.clearText(), onclick: items.clearCompleted, display: this.model.count < items.count() },
            list: this.list,
            toggleAll: { onclick: this.toggleAll },
            newItem: { onkeypress: this.addItem },
            count: { html: '<strong>'+this.model.count+'</strong> items left' }
        }
    }
});

var items = new ToDoCollection([
  // { id: 0, text: 'write todomvc', done: false }
]);

window.app = new App({ view: $('todoapp') });
