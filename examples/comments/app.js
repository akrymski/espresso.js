// Based on React's tutorial: 
// http://facebook.github.io/react/docs/tutorial.html

var Espresso = window.Espresso;
var Model = Espresso.Model;
var Collection = Espresso.Collection;
var Controller = Espresso.Controller;
var List = Espresso.List;
var converter = new window.Showdown.converter();

var Comment = Controller.extend({
	removeComment: function(e) {
		console.log('removing', this.model.id);
		comments.remove({ id: this.model.id });
		return false;
	},
	html: function() {
		return converter.makeHtml(this.model.get('text'));
	},
	render: function() {
		return {
			author: { text: this.model.author },
			html: { html: this.html() },
			remove: { onclick: this.removeComment }
		};
	}
});

var CommentForm = Controller.extend({
	save: function(e) {
		var comment = { author: this.ref.author.value, text: this.ref.text.value, id: comments.count() };
		comments.push(comment);
		e.target.reset();
		console.log('added', comment);
		return false;
	},
	render: function() {
		return {
			view: { onsubmit: this.save }
		};
	}
});

var CommentBox = Controller.extend({
	init: function() {
		this.commentForm = new CommentForm();
		this.list = new List(Comment, comments);
	},
	render: function() {
		return {
			commentForm: this.commentForm,
			commentList: this.list
		};
	}
});

var comments = new Collection([
  { id: 0, author: '@vla (Vlad Yazhbin)', text: 'This is one comment' },
  { id: 1, author: 'AngularJS', text: 'This is *another* comment' }
]);

window.app = new CommentBox({ view: document.querySelector('.commentBox') });