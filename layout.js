/**
 * Mapping between URLs and templates.
 *
 * In Meteor, both the client and the server know this mapping; one doesn't
 * simply navigate between pages.
 */

Router.configure({
  // the default layout that goes into <body>...</body>
  layoutTemplate: "defaultLayout"
});

Router.route('/', function () {
  this.render("Homepage");
});

renderUserSearchBoxInNavBar = function(thatRoute) {
  thatRoute.render('User$Pick', {
    to: "searchbox", 
    data: function() {
      return {id: "LayoutUserSearch"};
    }
  });
}

if (Meteor.isClient) {
  Template.User$Pick.events({
    'User$Pick:selected #LayoutUserSearch': function(event, that, id) {
      var url = '/user/' + id + '/edit';
      Router.go(url);
    }
  });
}

Router.route('/user', function () {
  renderUserSearchBoxInNavBar(this);
});

Router.route('/user/:sciper/edit', function () {
  renderUserSearchBoxInNavBar(this);
  var user = User.bySciper(this.params.sciper);
  this.render('User$Edit', {data: user});
});

Router.route('/billables', function () {
  this.render("Billables$Edit");
});

Router.route('/test', function () {
  this.render("Test");
});

