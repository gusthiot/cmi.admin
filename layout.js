import { Customers } from './customers/customers.js';
const policies = require("./policies/policies");
/**
 * Mapping between URLs and templates.
 *
 * In Meteor, both the client and the server know this mapping; one doesn't
 * simply navigate between pages.
 */
Router.configure({
    // the default layout that goes into <body>...</body>
    layoutTemplate: "defaultLayout",
    defaultBreadcrumbLastLink: true
});

Router.route('/', {
    title: 'home',
    name: 'home',
    showLink: true,
    action: function () {
        this.render("Homepage", {
            data: function () {
                return {
                    withLDAP: true,
                    id: "LayoutUserSearch"
                };
            }
        });
    }
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
};

if (Meteor.isClient) {
    Template.User$Pick.events({
        'user:selected #LayoutUserSearch': function(event, that, id) {
            if (id === undefined) return;
            let url = '/user/' + id + '/edit';
            Router.go(url);
        }
    });
}


Router.route('/users', {
    title: 'users',
    name: 'users',
    parent: 'home',
    loadingTemplate: 'Loading',
    waitOn: function () {
        return Meteor.subscribe("Users") && Meteor.subscribe("CustomerAccs");
    },
    action: function () {
        if(Meteor.user() && Meteor.user().levelId && policies.canViewHimself()) {
            console.log("allowed");
            this.render("Users$Edit");
            //renderUserSearchBoxInNavBar(this);
        }
        else {
            console.log("not allowed");
            Router.go('/');
        }
    }
});

Router.route('/users/:sciper/edit', {
    title: 'edit',
    name: 'edit',
    parent: 'users',
    action: function () {
        renderUserSearchBoxInNavBar(this);
        let user = User.bySciper(this.params.sciper);
        if (!user) {
            this.render('AccessControl$PermissionDenied');
        } else {
            this.render('User$Edit', {
                data: {
                    object: user
                }
            });
        }
    }
});

Router.route('/customer_accounts/:cmi', {
    title: 'custacc',
    name: 'custacc',
    parent: 'customers',
    loadingTemplate: 'Loading',
    waitOn: function () {
        return Meteor.subscribe("Customers") && Meteor.subscribe("AccountsCats");
    },
    action: function () {
        let one = Customers.findOne({codeCMi: this.params.cmi});
        if(one) {
            this.render("CustomerAccs$Edit", {
                data: function () {
                    return one._id;
                }
            });
        }
        else {
            Router.go('/');
        }
    }
});

Router.route('/rights/:user', {
    title: 'rights',
    name: 'rights',
    parent: 'users',
    loadingTemplate: 'Loading',
    waitOn: function () {
        return Meteor.subscribe("Users") && Meteor.subscribe("CustomerAccs");
    },
    action: function () {
        this.render("Rights$Edit", {
            data: function () {
                return this.params.user;
            }
        });
    }
});

Router.route('/accounts_categories', {
    title: 'accocat',
    name: 'accocat',
    parent: 'home',
    action: function () {
        this.render("AccountsCats$Edit");
    }
});

Router.route('/customers', {
    title: 'customers',
    name: 'customers',
    parent: 'home',
    loadingTemplate: 'Loading',
    waitOn: function () {
        return Meteor.subscribe("CustomersCats");
    },
    action: function () {
        this.render("Customers$Edit");
    }
});

Router.route('/customers_categories', {
    title: 'custcat',
    name: 'custcat',
    parent: 'home',
    action: function () {
        this.render("CustomersCats$Edit");
    }
});

/* Collect and render all modals at the bottom of the DOM */
import flatMap from 'lodash/flatMap';

if (Meteor.isClient) {
    IsScreenFullSize = MediaQuery("(min-width: 992px)");  // Same as Materialize's "hide-on-med-and-down"

    Template.nav.onRendered(function () {
        let $ = this.$.bind(this);
        $(".button-collapse").assertSizeAtLeast(1).sideNav();
        Tracker.autorun(function () {
            if (IsScreenFullSize.get()) {
                // Un-slide (like Materialize does for "fixed" on large screens)
                $('#navmenu-slidable').css('transform', '');
            }
        });
    });

    Template.nav$Menu.onRendered(function () {
        let $ = this.$.bind(this);
        $(".dropdown-button").assertSizeAtLeast(1).dropdown({
            belowOrigin: true, // Displays dropdown below the button
        });
    });

    Template.nav.helpers({
        sideNavClassOnMobile: function () {
            if (IsScreenFullSize.get()) {
                return {};
            } else {
                return {class: "side-nav"}
            }
        },
        allModalTemplates: function () {
            return flatMap(_.keys(Template), function (k) {
                if (k.match(/Modal$/)) {
                    return [{ tmpl: k }];
                } else {
                    return [];
                }
            });
        }
    });

    Template.nav$Menu.helpers({
        canSeeUsers: function () {
            if(Meteor.user() && Meteor.user().levelId) {
                return policies.canViewHimself();
            }
            return false;
        }
    });

    Template.bdcr.helpers({
        translate: function (what) {
            return TAPi18n.__("Layout.title." + what);
        }
    });

    Tequila.start();
}
