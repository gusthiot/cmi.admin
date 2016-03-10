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
      return {
        withLDAP: true,
        id: "LayoutUserSearch"
      };
    }
  });
}

if (Meteor.isClient) {
  Template.User$Pick.events({
    'user:selected #LayoutUserSearch': function(event, that, id) {
      if (id === undefined) return;
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
  if (!user) {
    this.render('AccessControl$PermissionDenied');
  } else {
    this.render('User$Edit', {data: {
      user: user,
      editingSelf: function() {
        return user._id === Meteor.userId();
      }
    }});
  }
});

Router.route('/billables', function () {
  this.render("Billables$Edit");
});

Router.route('/test', function () {
  this.render("Test");
});

/* Work around some kind of URL mapping bug in bootstrap-3 */
Router.route( "/packages/bootstrap-3/(.*)",
  function () {
    this.response.writeHead(302, {
      'Location': "/packages/mrt_bootstrap-3/" + this.params[0]
    });
    this.response.end();
  },
  { where: "server" });

