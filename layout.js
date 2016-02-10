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
  this.render("userEditAdmin");
});

Router.route('/user/:sciper/edit', function () {
  var user = User.bySciper(this.params.sciper);
  if (! user.canEdit(Meteor.userId)) {
      // TODO: Signal permission issue somehow
      return;
  }
  this.render('userEdit', {data: user});
});

/************** Layout controllers ******************/
if (Meteor.isClient) {
  Template.burgerMenuButton.events({
    "click": function(e) {
      $(".ui.sidebar").sidebar('toggle');
    }
  });
}
