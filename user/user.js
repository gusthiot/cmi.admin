/**
 * Model and controller for users
 */

var debug = Debug("user.js");

/**
 * @constructor
 */
User = function User(doc) {
  _.extend(this, doc);
};

Meteor.users._transform = function(doc) { return new User(doc); };

if (Meteor.isClient) {
  // Since this method doesn't exist in the server, it is secure by
  // construction; it cannot possibly return information that the client doesn't
  // already have access to.
  User.bySciper = function(sciper) {
    return User.collection.findOne({_id: sciper});
  }
}

function updateUser(that, change) {
  User.collection.update({_id: that._id},
                         {$set: change});
}

User.prototype.lang = function(opt_set) {
  var currentValue = this.profile ? this.profile.lang : undefined;
  if (opt_set) {
    if (currentValue !== opt_set) {
      updateUser(this, {"profile.lang": opt_set});
    }
  } else if (currentValue) {
    return currentValue;
  } else if (Meteor.isClient) {
    return I18N.browserLanguage();
  }
};

User.collection = Meteor.users;
User.collection.attachSchema(new SimpleSchema({
  _id: {
    label: "SCIPER",
    type: String,
    regEx: /G?[1-9][0-9]{3,6}/  // SCIPER for guests and employees
  },
  password: {
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
    allowedValues: _.pluck(I18N.Languages, "code")
  }
}));

Meteor.startup(function() {
  // As per http://stackoverflow.com/a/21853298/435004:
  // this merges gently with the default publish in accounts_server.js !
  Policy.canReadOwnFullName.publish(null, function() {
    return Meteor.users.find({
      _id: this.userId
    }, { fields: {_id: true, fullName: true}});
  });
  Policy.canReadUserBasicDetails.publish(null, function() {
    return Meteor.users.find({}, {fields: {_id: true, fullName: true}});
  });
});

/**
 * User searches
 *
 * User can search for already known CMi users (which is presumably fast),
 * as well as across the entire EPFL LDAP directory (could be slower).
 */
User.Search = new Search("userSearch");

if (Meteor.isServer) {
  var ldapContext = require("epfl-ldap")(),
    escapeStringRegexp = require('escape-string-regexp'),
    Future = require('fibers/future'),
    getSyncUserByName = Meteor.wrapAsync(ldapContext.users.searchUserByName);

  User.Search.publish(function (query, wantLDAP) {
    Policy.canSearchUsers.check(this);
    var self = this;

    if (query.length < 3) {
      self.stop();
      return;
    }

    var found = {};
    function addOrChange(id, data) {
      if (id in found) {
        self.changed(id, data);
      } else {
        self.added(id, data);
        found[id] = 1;
      }
    }

    var futures = [];
    futures.push(Future.task(function findInMongo() {
      User.collection.find({fullName: new RegExp(escapeStringRegexp(query))})
        .fetch().forEach(function (result) {
          addOrChange(result._id, result);
        });
    }));
    if (wantLDAP) {
      futures.push(Future.task(function findInLDAP() {
        if (! Devsupport.isOnline()) {
          return Devsupport.fakeData.ldapUsers(self, query);
        }
        getSyncUserByName(query).forEach(function (result) {
          addOrChange(result.sciper, {ldapFullName: result.displayName});
        });
      }));
    }
    try {
      Future.wait(futures);
      futures.map(function(f) {f.get();});
      self.stop();
    } catch (e) {
      self.stop(e);
    }
  });
}

if (! Meteor.isClient) return; /******************************************/

Template.User$Edit.helpers({
  editingSelf: function() {
    return Template.currentData().object._id === Meteor.userId();
  },
  schema: function() { 
    return Policy.editUser.call(Template.currentData().object);
  }
});

Template.User$Edit.events({
  "submit form": function(event) {
    console.log(this);
    event.preventDefault();
  }
});

/**
 * User$Pick: widget to pick a user
 *
 * @template_param id       DOM ID to assign
 * @template_param withLDAP True iff the widget should allow searching in LDAP
 *
 * @event user:selected User selected a search result. Callback receives (event,
 *                      target, _id) parameters, where _id is the SCIPER of the
 *                      selected user
 */
Template.User$Pick.onCreated(function () {
  var self = this;
  User.template = this; // To access from the browser console
  self.search = User.Search.open();

  self.wantLDAP = new ReactiveVar(false);
  self.query = new ReactiveVar(undefined);
  Tracker.autorun(function() {
    var query = self.query.get(),
      wantLDAP = self.wantLDAP.get();
    debug("Updating search :<" + query + "> (wantLDAP=" + wantLDAP + ")");
    if (query) self.search.search(query, wantLDAP);
  });
});

function that() { return Template.instance(); }

Template.User$Pick.helpers({
  wantLDAP: function() {
    return that().wantLDAP.get();
  },
  cmiUsers: function() {
    return that().search.find({ldapFullName: {$exists: false}});
  },
  ldapUsers: function() {
    return that().search.find({ldapFullName: {$exists: true}});
  },
  isLoading: function() {
    return that().search.isLoading()
  },
  messageCode:   function() {
    var status = that().search.status();
    if (! status || status.status === "nosearchyet") {
      return undefined;
    } else if (status.status === "OK") {
      return status.resultCount ? undefined: "User.search.nosearchresults";
    } else {
      var i18nKey = (status.message || status.error || status.status);
      return "User.search." + i18nKey;
    }
  }
});  // Template.User$Pick.helpers

function openDropdown(that) {
  if (! that.$(".dropdown-menu").is(":visible")) {
    // Careful to hit the right DOM entry!
    // Toggling on the .dropdown-menu *appears* to work, but that kills
    // all event handlers therein.
    // Bootstrap 3 doc is less than clear on this one (if not plain misleading)
    that.$('[data-toggle="dropdown"]').dropdown("toggle");
  }
}

Template.User$Pick.events({
  "keyup input.usersearch": function(event, that) {
    that.query.set(event.currentTarget.value);
    openDropdown(that);  // If we arrived via keyboard
  },
  "click a.user": function(event, that) {
    that.$("div").trigger("user:selected",
                          [$(event.target).attr("data-value")]);
    that.$("input.usersearch").val($(event.target).text());
    event.preventDefault();
  },
  "click a.ldapbutton": function(event, that) {
    that.wantLDAP.set(true);
    event.preventDefault();
  }
});  // Template.User$Pick.events
