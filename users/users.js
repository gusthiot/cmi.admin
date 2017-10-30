/**
 * Model and controller for users
 */

import I18N from "../i18n/i18n.js";
const policies = require("../policies/policies");

const shared = require("../lib/shared");
import { Rights } from '../rights/rights.js';

var debug = require( "debug" )( "users/users.js" );

/**
 * @constructor
 */
Users = function Users(doc) {
    _.extend( this, doc );
};

Meteor.users._transform = function (doc) {
    return new Users( doc );
};

function updateUser(that, change) {
    Users.collection.update( {_id: that._id}, {$set: change} );
}

Users.prototype.lang = function (opt_set) {
    var currentValue = this.profile ? this.profile.lang : undefined;
    if (opt_set) {
        if (currentValue !== opt_set) {
            updateUser( this, {"profile.lang": opt_set} );
        }
    } else if (currentValue) {
        return currentValue;
    } else if (Meteor.isClient) {
        return I18N.browserLanguage();
    }
};

Users.collection = Meteor.users;
Users.collection.name = "Users";
Users.collection.schema = new SimpleSchema({
    _id: {
        type: String,
        regEx: /G?[1-9][0-9]{3,6}/  // SCIPER for guests and employees
    },
    firstname: {
        type: String
    },
    lastname: {
        type: String
    },
    phone: {
        type: String
    },
    email: {
        type: String
    },
    userId: {
        type: String
    },
    login: {
        type: String
    },
    password: {
        type: String
    },
    right: {
        type: Boolean
    },
    levelId: {
        type: String
    },
    creation: {
        type: String
    },
    changes: {
        type: String
    },
    closing : {
        type: String
    },
    fullName: {
        type: String
    },
    services: {
        type: Object,
        blackbox: true
    },
    profile: {
        type: Object
    },
    "profile.lang": {
        type: String,
        allowedValues: _.keys(I18N.Languages)
    }
});
Users.collection.columns =
    ["_id", "firstname", "lastname", "phone", "email", "userId", "login", "password", "right", "levelId", "creation", "changes",
        "closing"];

Users.collection.allow({
    insert: function () {
        return true;
    },

    remove: function () {
        return true;
    },

    update: function () {
        return true;
    }

});
/*
Meteor.startup( function () {
    // As per http://stackoverflow.com/a/21853298/435004:
    // this merges gently with the default publish in accounts_server.js !

    Policy.canReadOwnFullName.publish( null, function () {
        return Meteor.users.find( {_id: this.userId} );
    } );
    Policy.canReadUserBasicDetails.publish( null, function () {
        return Meteor.users.find( {} );
    } );
} );
*/
/**
 * Users searches
 *
 * Users can search for already known CMi users (which is presumably fast),
 * as well as across the entire EPFL LDAP directory (could be slower).
 */
Users.Search = new Search( "userSearch" );

if (Meteor.isServer) {
    if (Users.collection.find({}).count() === 0) {
        Users.collection.insert({_id: "138027", fullName: "Christophe Gusthiot", firstname: "Christophe", lastname: "Gusthiot", userId: "user0", login: "cgusthiot", levelId: "0"});
        Users.collection.insert({_id: "133333", fullName: "Philippe Langlet", firstname: "Philippe", lastname: "Langlet", userId: "user1", login: "planglet", levelId: "0"});
        Users.collection.insert({_id: "243371", fullName: "Dominique Quatravaux", firstname: "Dominique", lastname: "Quatravaux", userId: "user2", login: "dquatravaux", levelId: "0"});


        Users.collection.insert({_id: "203491", fullName: "Joffrey Pernollet", firstname: "Joffrey", lastname: "Pernollet", userId: "user01236", login: "jpernollet", levelId: "2"});
        Users.collection.insert({_id: "251551", fullName: "Remy Juttin", firstname: "Remy", lastname: "Juttin", userId: "user01904", login: "rjuttin", levelId: "3"});

        Users.collection.insert({_id: "251843", fullName: "Julien Fluck", firstname: "Julien", lastname: "Fluck", userId: "user02099", login: "jfluck", levelId: "4"});
        Users.collection.insert({_id: "276161", fullName: "Audrey Berset", firstname: "Audrey", lastname: "Berset", userId: "user02554", login: "aberset", levelId: "4"});
    }

    Meteor.publish(Users.collection.name, function () {
        if (Meteor.user() && Meteor.user().levelId) {
            if(policies.canViewUsers()) {
                console.log("all");
                return Users.collection.find({});
            }
            else {
                if(policies.canViewHimself()) {
                    console.log("one");
                    return Users.collection.find({_id: Meteor.userId()});
                }
            }
        }
        console.log("none");
        return Users.collection.find({_id: "-1"});

    });

    let ldapContext;
    function findInLDAP() {
        if (!Devsupport.isOnline()) {
            return Devsupport.fakeData.ldapUsers( self, query );
        }
        if (! ldapContext) {
            ldapContext = require( "epfl-ldap" )();
        }
        Meteor.wrapAsync( ldapContext.users.searchUserByName )( query ).forEach( function (result) {
            addOrChange( result.sciper, {ldapFullName: result.displayName} );
        });
    }

    let escapeStringRegexp = require( 'escape-string-regexp' ),
        Future = require( 'fibers/future' );

    Users.Search.publish( function (query, wantLDAP) {
        Policy.canSearchUsers.check( this );
        let self = this;

        if (query.length < 3) {
            self.stop();
            return;
        }

        var found = {};

        function addOrChange(id, data) {
            if (id in found) {
                self.changed( id, data );
            } else {
                self.added( id, data );
                found[id] = 1;
            }
        }

        var futures = [];
        futures.push( Future.task( function findInMongo() {
            Users.collection.find( {fullName: new RegExp( escapeStringRegexp( query ) )} )
                .fetch().forEach( function (result) {
                addOrChange( result._id, result );
            } );
        } ) );
        if (wantLDAP) {
            futures.push( Future.task( findInLDAP ) );
        }
        try {
            Future.wait( futures );
            futures.map( function (f) {
                f.get();
            } );
            self.stop();
        } catch (e) {
            self.stop( e );
        }
    } );
}

function makeTable() {
    return shared.makeTable(Users.collection);
}
let theTable = makeTable();

if (!Meteor.isClient) return;

if (Meteor.isClient) {
    require("../lib/widget/client/widget");
    require( "../lib/client/find-templates" );

    Meteor.subscribe(Users.collection.name);

    Template.Users$Edit.find = function (that) {
        if (that === undefined) {
            that = Template.instance();
        }
        if (that instanceof Blaze.TemplateInstance) {
            return Template.instance().findParent("Template." + Users.collection.name + "$Edit");
        }
    };

    Template.Users$Edit.helpers({
        makeTable: theTable,
        selector: function() {
            let ids = [];
            Users.collection.find({}, {fields: {_id: true}}).fetch().forEach( function(res) {
               ids.push(res._id);
            });
            return {_id : { $in: ids}} ;

        }
    });

    Session.set('editingRow', 'undefined');
    Session.set('saving', 'undefined');

    Template.Users$Edit.events({
        'click tr': function (event) {
            if(policies.canEditUsers()) {
                if (Session.get('saving') === "undefined") {
                    let dataTable = $(event.currentTarget).closest('table').DataTable();
                    if (dataTable && dataTable !== "undefined") {
                        let row = dataTable.row(event.currentTarget).data();
                        if (row && row !== "undefined") {
                            if (Session.get('editingRow') === "undefined" || Session.get('editingRow')._id !== row._id)
                                Session.set('editingRow', row);
                        }
                        else
                            Session.set('editingRow', 'undefined');
                    }
                    else
                        Session.set('editingRow', 'undefined');
                }
                else {
                    event.preventDefault();
                    let values = shared.getChildrenValues($(event.currentTarget).children(), Users.collection.columns);
                    if (checkValues(values, 'update')) {
                        let updatingValues = shared.updatingValues(values, Session.get('editingRow'));
                        if (updatingValues.hasOwnProperty('firstname') || updatingValues.hasOwnProperty('lastname'))
                            updatingValues['fullName'] = values['firstname'] + " " + values['lastname'];
                        if (Object.keys(updatingValues).length > 0) {
                            Users.collection.update(Session.get('editingRow')._id,
                                {$set: updatingValues},
                                function (error) {
                                    if (error)
                                        Materialize.toast(error, 5000);
                                    else
                                        Materialize.toast("Mise à jour effectuée", 5000);
                                });
                        }
                        else
                            Materialize.toast("Pas de changement", 5000);
                        Session.set('editingRow', 'undefined');
                    }
                    Session.set('saving', 'undefined');
                }
            }
        }
    });

    let allCellTemplates = Users.collection.columns.map(function (x) {
        return Template["Users$cell$" + x]
    });

    allCellTemplates.forEach(function (tmpl) {
        if (!tmpl) return;
        tmpl.helpers({
            isEditing: function () {
                if(Session.get('editingRow') !== 'undefined' && Session.get('editingRow')._id === Template.currentData()._id)
                    return 1;
                else
                    return 0;
            }
        });
    });

    Template.Users$columnHead.events({
        'change select': function (event, template) {
            let val = $.fn.dataTable.util.escapeRegex(
                $(event.target).val()
            );
            template.dataTable.column
                .search(val ? '^' + val + '$' : '', true, false)
                .draw();
        }
    });

    Template.Users$columnHead.helpers({
        helpers: {
            translateKey: function (what) {
                if(what) {
                    if (Template.currentData().value === "levelId") {
                        let one = policies.Levels.findOne({_id: what});
                        if(one) {
                            return one.name;
                        }
                        else
                            console.log("no level for : " + what);
                    }
                }
                return what;
            }
        },
        translate: function (what) {
            if(what !== "_id")
                return TAPi18n.__("Users.column." + what);
            else
                return TAPi18n.__("Users.column.sciper");
        }
    });

    Template.Users$cell$right.helpers({
        rights: function () {
            return ["Actif", "Passif"];
        }
    });

    Template.Users$cell$save.helpers({
        selected: function () {
            if(Session.get('editingRow') !== 'undefined' && Session.get('editingRow')._id === Template.currentData()._id) {
                return 1;
            }
            return 0;
        }
    });

    Template.Users$cell$save.events({
        'click .save': function (event) {
            event.preventDefault();
            Session.set('saving', 'yes');
        }
    });

    Template.Users$cell$levelId.helpers({
        helpers: {
            translateKey: function (levelId) {
                if(levelId) {
                    let one = policies.Levels.findOne({_id: levelId});
                    if(one)
                        return one.name;
                    else
                        console.log("no level for : " + levelId);

                }
                return levelId;
            }
        },
        levels: function () {
            let levs = policies.Levels.find({});
            if(!levs)
                return [];
            let results = [];
            levs.forEach(function(lev) {
                results.push(lev._id);
            });
            return results;
        }
    });

    Template.Users$Pagination.events({
        "click button.previous": function (event, templateInstance) {
            templateInstance.paginate.previous();
        },
        "click button.nexts": function (event, templateInstance) {
            templateInstance.paginate.next();
        }
    });

    Template.Users$Pagination.helpers({
        notnull: function (pages) {
            return pages > 0;
        },
        notfirst: function (page) {
            return page > 1;
        },
        notlast: function (page, pages) {
            return page < pages;
        }
    });

    Template.Users$addButton.onRendered(function () {
        this.$('.modal-trigger').assertSizeEquals(1).leanModal();
    });

    function checkValues(values, mode) {
        if(values._id !== "" && !shared.isPositiveInteger(values._id)) {
            Materialize.toast("Sciper invalide !", 5000);
        }
        else if(mode === "insert" && Users.collection.find({_id: values._id}).count() > 0) {
            Materialize.toast("Ce Sciper est déjà utilisé !", 5000);
        }
        else if(mode === "update" && values._id !== Session.get('editingRow')._id)  {
            Materialize.toast("Vous ne pouvez pas changer le sciper, vous devez créer un nouvel utilisateur quitte à effacer celui-ci !", 5000);
        }
        else if(values.firstname === "") {
            Materialize.toast("Prénom invalide !", 5000);
        }
        else if(values.lastname === "") {
            Materialize.toast("Nom invalide !", 5000);
        }
        else if(values.email === "" || !validateEmail(values.email)) {
            Materialize.toast("Email invalide !", 5000);
        }
        else if(values.userId === "") {
            Materialize.toast("User Id invalide !", 5000);
        }
        else if((mode === "insert" || (mode === "update") && values.userId !== Session.get('editingRow').userId) &&
            (Users.collection.find({userId: values.userId}).count() > 0)) {
            Materialize.toast("Ce User Id est déjà utilisé !", 5000);
        }
        else if(values.login === "") {
            Materialize.toast("Login invalide !", 5000);
        }
        else if((mode === "insert" || (mode === "update") && values.login !== Session.get('editingRow').login) &&
            (Users.collection.find({login: values.login}).count() > 0)) {
            Materialize.toast("Ce Login est déjà utilisé !", 5000);
        }
        else return true;
        return false;
    }

    function validateEmail(email) {
        let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    Template.Users$modalAdd.events({
        'click .modal-done': function (event, templ) {
            event.preventDefault();
            let values = {
                _id: templ.$('#sciper').val(),
                firstname: templ.$('#firstname').val(),
                lastname: templ.$('#lastname').val(),
                phone: templ.$('#phone').val(),
                email: templ.$('#email').val(),
                userId: templ.$('#user_id').val(),
                login: templ.$('#login').val(),
                password: templ.$('#password').val(),
                right: $(templ.find('input:radio[name=right]:checked')).val(),
                levelId: templ.$('#level').val(),
                creation: templ.$('#creation').val(),
                changes: templ.$('#changes').val(),
                closing: templ.$('#closing').val()
            };
            if(checkValues(values, 'insert')) {
                values['fullName'] = values['firstname'] + " " + values['lastname'];
                console.log(values);
                Users.collection.insert(values);
                Materialize.toast("Insertion effectuée", 5000);
                templ.find("form").reset();
            }
        }
    });

    Template.Users$modalAdd.helpers({
        levels: function () {
            return policies.Levels.find({});
        },
        translate: function (what) {
            return TAPi18n.__("Users.column." + what);
        },
        modalAdd: function () {
            return TAPi18n.__("Users.modal.add");
        }
    });

    Template.Users$level.onRendered(function(){
        $('#level').material_select();
    });

    Template.Users$cell$remove.events({
        'click .cancelItem': function (event) {
            event.preventDefault();
            let count = Rights.find({userId: this._id}).count();
            if (count > 0) {
                Materialize.toast("Suppression impossible, article utilisé " + count
                    + " fois dans la base de données ‘Droits‘", 5000);
            }
            else {
                shared.confirmRemove(this._id, this._id, Users.collection);
            }
        }
    });
    // Since this method doesn't exist in the server, it is secure by
    // construction; it cannot possibly return information that the client doesn't
    // already have access to.
    Users.bySciper = function (sciper) {
        return Users.collection.findOne( {_id: sciper} );
    };

    // initialization of Materialize framework
    AutoForm.setDefaultTemplate( 'materialize' );

    // select option in template
    Template.User$Edit.onRendered( function () {
        $( 'select' ).material_select();
    } );
}

/******************************************/

Template.User$Edit.helpers( {
    editingSelf: function () {
        return Template.currentData().object._id === Meteor.userId();
    },
    schema: function () {
        return Policy.editUser.call( Template.currentData().object );
    }
} );

Template.User$Edit.events( {
    "submit form": function (event) {
        debug( this );
        event.preventDefault();
    }
} );

/**
 * User$Pick: widget to pick a user
 *
 * @template_param id       DOM ID to assign
 * @template_param withLDAP True if the widget should allow searching in LDAP
 *
 * @event user:selected User selected a search result. Callback receives (event,
 *                      target, _id) parameters, where _id is the SCIPER of the
 *                      selected user
 */
Template.User$Pick.onCreated( function () {
    var self = this;
    debug( "User$Pick onCreated: starting" );
    Users.template = this; // To access from the browser console
    self.search = Users.Search.open();

    self.wantLDAP = new ReactiveVar( false );
    self.query = new ReactiveVar( undefined );
    Tracker.autorun( function () {
        var query = self.query.get(),
            wantLDAP = self.wantLDAP.get();
        debug( "Updating search :<" + query + "> (wantLDAP=" + wantLDAP + ")" );
        if (query) self.search.search( query, wantLDAP );
    } );
    debug( "User$Pick onCreated: done" );
} );

function that() {
    return Template.instance();
}

function openDropdown(that) {
    if (!that.$( ".dropdown-content" ).is( ":visible" )) {
        // Careful to hit the right DOM entry!
        // Toggling on the .dropdown-menu *appears* to work, but that kills
        // all event handlers therein.
        // Bootstrap 3 doc is less than clear on this one (if not plain misleading)
        that.$( '[data-toggle="dropdown"]' ).dropdown( "toggle" );
    }
}

// TODO: implementation of viewmodel for user User$pick searching input
Template.User$Pick.viewmodel( {
    wantLDAP: function () {
        return that().wantLDAP.get();
    },
    cmiUsers: function () {
        return that().search.find( {ldapFullName: {$exists: false}} );
    },
    ldapUsers: function () {
        return that().search.find( {ldapFullName: {$exists: true}} );
    },
    isLoading: function () {
        return that().search.isLoading()
    },
    messageCode: function () {
        var status = that().search.status();
        if (!status || status.status === "nosearchyet") {
            return undefined;
        } else if (status.status === "OK") {
            return status.resultCount ? undefined : "Users.search.nosearchresults";
        } else {
            var i18nKey = (status.message || status.error || status.status);
            return "Users.search." + i18nKey;
        }
    }
} );


Template.User$Pick.events( {
    "keyup input.usersearch": function (event, that) {
        debug( "Search term is now " + event.currentTarget.value );
        that.query.set( event.currentTarget.value );
        openDropdown( that );  // If we arrived via keyboard
    },
    "click": function (event, that) {
        debug( "CLICK" );
        event.preventDefault();
    },
    "click a.user": function (event, that) {
    //    that.$( "div" ).trigger( "user:selected", [$( event.target ).attr( "data-value" )] );
        that.$( "input.usersearch" ).val( $( event.target ).text() );
        event.preventDefault();
    },
    "click a.ldapbutton": function (event, that) {
        that.wantLDAP.set( true );
        event.preventDefault();
    }
} );  // Template.User$Pick.events

Template.User$Pick.onRendered( function () {
    $( '.usersearch' ).assertSizeAtLeast( 1 ).dropdown( {
            belowOrigin: true // Displays dropdown below the button
        }
    );
} );
