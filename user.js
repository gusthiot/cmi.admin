/**
 * Model and controller for users
 */

/**
 * @constructor
 */
User = function User(doc) { _.extend(this, doc); };
if (Meteor.isClient) {
  User.current = function() {
    return new User(Meteor.user());
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

User.prototype.setPassword = function(password) {
    updateUser(this, {"password": password});
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

// As per http://stackoverflow.com/a/21853298/435004:
// this merges gently with the default publish in accounts_server.js !
if (Meteor.isServer) {
  Meteor.publish(null, function() {
    if (! this.userId) return;
    return Meteor.users.find({
      _id: this.userId
    }, { fields: {fullName: 1}});
  });
}

/**
 * User searches
 *
 * User can search for already known CMi users (which is presumably fast),
 * as well as across the entire EPFL LDAP directory (could be slower).
 */
User.Search = new Search("userSearch");

if (Meteor.isServer) {
  var ldapContext = Meteor.npmRequire('epfl-ldap')(),
    escapeStringRegexp = Meteor.npmRequire('escape-string-regexp'),
    Future = Meteor.npmRequire('fibers/future'),
    getSyncUserByName = Meteor.wrapAsync(ldapContext.users.searchUserByName);

  User.Search.publish(function (query, wantLDAP) {
    var self = this;

    if (query.length < 3) {
      self.stop();
      return;
    }

    if (! Devsupport.isOnline()) {
      return Devsupport.fakeData.searchUsers(self, query, wantLDAP);
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

var debug = console.log.bind(console);

if (Meteor.isClient) {
  Template.User$Edit.events({
    "submit form": function(e) {
      console.log(this);
      return false;
    }
  });

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

  var that = function that() { return Template.instance(); }
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
        return;
      } else if (status.status === "OK") {
        return status.resultCount ? undefined: "search#nosearchresults";
      } else {
        var i18nKey = (status.message || status.error || status.status);
        return "search#" + i18nKey;
      }
    }
  });  // Template.User$Pick.helpers

  Template.User$Pick.events({
    "keyup input.usersearch": function(event) {
      that().query.set(event.currentTarget.value);
      var dropdown = $(that().find(".dropdown-menu"));
      if (! dropdown.is(":visible")) dropdown.dropdown("toggle");
    },
    "click a.user": function() {
      alert(this._id);
    },
    "click a.ldapbutton": function(event) {
      that().wantLDAP.set(true);
      event.stopPropagation();
    }
  });
}
