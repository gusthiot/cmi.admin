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
            object: user
        }});
    }
});

Router.route('/billables', function () {
    this.render("Billables$Edit");
});

if (Devsupport.isActive()) {
    Router.route('/test', function () {
        this.render("Test");
    });
    Router.route('/devsupport/kafka/(.*)', function () {
        var topic = this.params[0];
        Kafka.subscribe(topic);
        this.render("Kafka", {data: {
            topic: topic
        }});
    });
}

/* Work around some kind of URL mapping bug in bootstrap-3 */
Router.route("/packages/bootstrap-3/(.*)",
    function () {
        this.response.writeHead(302, {
            'Location': "/packages/mrt_bootstrap-3/" + this.params[0]
        });
        this.response.end();
    },
    { where: "server" });

if (Meteor.isClient) {
    Template.nav.onRendered(function(){
        $(".button-collapse").assertSizeAtLeast(1).sideNav();
    });
    Template.nav$Menu.onRendered(function () {
        $(".dropdown-button").assertSizeAtLeast(1).dropdown();
    });

    IsScreenFullSize = MediaQuery("(min-width: 992px)");  // Same as Materialize's "hide-on-med-and-down"
    Template.nav.helpers({
        isScreenFullSize: function () {
          return IsScreenFullSize.get();
        },
        navAttributes: function () {
            if (IsScreenFullSize.get()) {
                return {};
            } else {
                return {id: "navmenu-slidable", class: "side-nav"}
            }
        }
    })
}
