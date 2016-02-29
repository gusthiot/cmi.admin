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

Router.route('/user/:sciper/edit', function () {
  console.log("/user/:sciper/edit");
  var user = User.bySciper(this.params.sciper);
  if (! Security.can("XXX")) {
      // TODO: Signal permission issue somehow
    console.log("Cannot!");
    return;
  }
  this.render('User$Edit', {data: user});
});

Router.route('/billable', function () {
  this.render("Billable$Edit");
});

