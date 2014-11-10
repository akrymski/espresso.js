// todomvc
var Espresso    = window.Espresso
var Model       = Espresso.Model
var Collection  = Espresso.Collection
var Controller  = Espresso.Controller
var List        = Espresso.List
var extend      = Espresso.extend
var ENTER_KEY   = 13;
var ESC_KEY     = 27;

var ToDoStore = extend(Collection, {
    init: function() {
        this.clearCompleted = this.clearCompleted.bind(this);
        this.add = this.add.bind(this);
        this.reset(JSON.parse(localStorage.getItem('todo')));
        this.addListener('change', this.save.bind(this));
    },
    add: function(txt) {
        this.push({ done: false, id: this.count(), text: txt })
    },
    toggle: function(id, done) {
        this.set({ id: id, done: done })
    },
    toggleAll: function(done) {
        this.forEach(function(v, i) {
            if (v.done !== done) {
                this.set(i, { done: done, text: v.text, id: v.id })
            }
        }.bind(this))
    },
    clearCompleted: function() {
        this.set(this.active());
    },
    completed: function() {
        return this.filter(function(v) { return v.done });
    },
    active: function() {
        return this.filter(function(v) { return !v.done });
    },
    all: function() {
        return this.toArray();
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
        store.remove({ id: this.model.id });
    },
    key: function(e) {
        if (e.which === ENTER_KEY) this.set({ editing: false, text: e.target.value });
        else if (e.which === ESC_KEY) {
            this.set({ editing: false });
            e.target.value = this.model.text;
        }
    },
    toggle: function(e) {
        store.toggle(this.model.id, e.target.checked);
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
        this.model.filter = window.location.hash.replace('#/', '') || 'all';
        if (this.model.filter === 'active') this.filter({ target: this.ref.active });
        if (this.model.filter === 'completed') this.filter({ target: this.ref.completed });

        this.list = new List(ToDoItem);
        this.listenTo(store, 'change', this.render);
    },
    filter: function(e) {
        if (e === undefined) return 
        if (e.target.nodeName === 'A') {
            document.querySelector('a.selected').classList.remove('selected');
            e.target.classList.add('selected')
            this.model.set({ filter: e.target.innerHTML.toLowerCase() })
        }
    },
    addItem: function(e) {
        if (e.which !== ENTER_KEY) return;
        store.add(this.ref.newItem.value)
        this.ref.newItem.value = '';
    },
    toggleAll: function(e) {
        store.toggleAll(e.target.checked);
    },
    clearText: function() {
        var x = store.completed().length;
        return 'Clear completed (' + x + ')'
    },
    render: function() {
        return {
            list: this.list.set(store[this.model.filter]()),
            filters: { onclick: this.filter },
            footer: { display: store.count() > 0 },
            toggleAll: { onclick: this.toggleAll },
            newItem: { onkeypress: this.addItem },
            count: { html: '<strong>'+store.active().length+'</strong> items left' },
            clear: { text: this.clearText(), onclick: store.clearCompleted, display: store.completed().length > 0 }
        }
    }
});

var store = new ToDoStore([
  // { id: 0, text: 'write todomvc', done: false }
]);

window.app = new App({ view: document.getElementById('todoapp') });
