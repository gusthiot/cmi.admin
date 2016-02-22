/**
 * Model and controller for users
 */

/**
 * @constructor
 */
User = function User(doc) { _.extend(this, doc); };

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

User.Search = new Search("userSearch");

// As per http://stackoverflow.com/a/21853298/435004:
// this merges gently with the default publish in accounts_server.js !
Meteor.publish(null, function() {
  if (! this.userId) return;
  return Meteor.users.find({
    _id: this.userId,
  }, { fields: {fullName: 1}});
});

/**
 * User searches
 *
 * User can search for already known CMi users (which is presumably fast),
 * as well as across the entire EPFL LDAP directory (could be slower).
 */
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

if (Meteor.isClient) {
  Template.userEdit.events({
    "submit form": function(e) {
      console.log(this);
      return false;
    }
  });

  Template.User$Pick.onCreated(function () {
    User.template = this; console.log("For debug");
    this.search = User.Search.open();
    this.wantLDAP = new ReactiveVar(false);
    this.currentQuery = new ReactiveVar();
  });

  function search() { return Template.instance().search; }
  Template.User$Pick.helpers({
    wantLDAP: function() {
      return Template.instance().wantLDAP.get();
    },
    cmiUsers: function() {
      return search().find({ldapFullName: {$exists: false}});
    },
    ldapUsers: function() {
      return search().find({ldapFullName: {$exists: true}});
    },
    isLoading: function() { return search().isLoading() },
    messageCode:   function() {
      var status = search().status.get();
      if (! status || status.status === "nosearchyet") {
        return;
      } else if (status.status === "OK") {
        return status.resultCount ? undefined: "search#nosearchresults";
      } else {
        return "search#" + (status.message || status.error || status.status);
      }
    }
  });

  Template.User$Pick.onRendered(function () {
    var self = this;
    var dropdown = $(this.find(".selection.dropdown"));
    dropdown.dropdown();

    // Reach into the innards of the dropdown module to wire it with Meteor
    var dropdownObj = dropdown.data().moduleDropdown;
    dropdownObj.filter = function(query) {
      console.log("Query is now " + query);
      self.currentQuery.set(query);
    };
    Tracker.autorun(function updateSearchQuery() {
      var wantLDAP = self.wantLDAP.get(),
        query = self.currentQuery.get();
      console.log("Updating search :<" + query + "> (wantLDAP=" + wantLDAP + ")");
      if (query) self.search.search(query, wantLDAP);
    });
    Tracker.autorun(function() {
      var status = self.search.status.get();
      console.log("Status is ", status);
      if (! status) {
        dropdownObj.set.loading();
      } else {
        dropdownObj.remove.loading();
        if (status.status !== "nosearchyet") dropdownObj.show();
      }
    });

    var button = $(this.find(".ldapbutton"));
    button.click(function (event) {
      console.log("I want LDAP");
      self.wantLDAP.set(true);
      event.stopPropagation();
    });
  });
}
