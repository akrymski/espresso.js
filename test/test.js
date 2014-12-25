global.window = {};

var espresso = require("../index.js")
var assert = require("assert")

var comments = [
  { id: 0, author: '@vla (Vlad Yazhbin)', text: 'This is one comment' },
  { id: 1, author: 'AngularJS', text: 'This is *another* comment' },
  { id: 2, author: 'Author', text: 'This is a comment' }
];

var newComments = [
  { id: 1, author: 'AngularJS', text: 'This is *another* comment' },
  { id: 3, author: 'new Author', text: 'inserted' },
  { id: 2, author: 'Author', text: 'updated' },
  { id: 4, author: 'Author', text: 'inserted' }
]

var collection = new espresso.Collection();
var model = new espresso.Model({ a:1,b:2 });

describe('#isEqual', function() {
  it('should do deep comparison', function() {
    assert.equal(true, espresso.isEqual({
      a: [1,{b:2, c:3, d:[4]}]
    }, {
      a: [1,{b:2, c:3, d:[4]}]
    }))
    assert.equal(false, espresso.isEqual({
      a: [1,{b:2, c:3, d:[4]}]
    }, {
      a: [1,{b:2, e:3, d:[4]}]
    }))
  })
})

describe('Model', function() {
  describe('#toObject', function() {
    it('should return object', function() {
      assert.deepEqual(model.toObject(), { a:1,b:2 })
    })
  })
  describe('#get', function() {
    it('should return value', function() {
      assert.equal(model.get('a'), 1)
      assert.equal(model.b, 2)
    })
  })
  describe('#set', function() {
    it('should set object', function() {
      model.set('c', 3);
      assert.deepEqual(model.set({ a:2,c:3 }), { a:2,b:2,c:3 })
    })
  })
  describe('#isEqual', function() {
    it('should check if values equal', function() {
      assert.equal(true, model.isEqual({a:2,c:3}))
    })
  })
})

describe('Collection', function() {
  describe('#push', function() {
    it('should add item', function() {
      var len = collection.push({a:1},{b:2})
      assert.equal(len, 2);
      assert.deepEqual(collection.toArray(), [{a:1},{b:2}])
    })
  })
  describe('#splice', function() {
    it('should splice items', function() {
      var removed = collection.splice(1, 1, {c:3});
      assert.deepEqual(removed, [{b:2}])
      assert.deepEqual(collection.toArray(), [{a:1},{c:3}])
    })
  })
  describe('#reset', function() {
    it('should reset collection', function() {
      collection.reset(comments);
      comments.forEach(function(v, i) {
        assert.equal(collection.get(i), comments[i]);
      })
    })
  })
  describe('#count', function() {
    it('should count items', function() {
      assert(collection.count(), comments.length);
    })
  })
  describe('#set', function() {
    it('should add/remove/update items', function() {
      collection.set(newComments);
      assert.deepEqual(collection.toArray(), newComments)
      assert.equal(collection.get(0), comments[1])
    })
  })
  describe('#get', function() {
    it('should find items', function() {
      assert.deepEqual(collection.get({id:1}), newComments[0])
    })
  })
  describe('#set', function() {
    it('should update item', function() {
      collection.set({id:1,text:'bob'})
      assert.deepEqual(collection.get({id:1}), { id: 1, author: 'AngularJS', text: 'bob' })
    })
  })
  describe('#remove', function() {
    it('should remove item', function() {
      collection.remove({id:1})
      assert.equal(collection.findIndex({id:1}), -1)
    })
  })
})
