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
  }
}));

User.Search = new Search("userSearch");

// TODO: This is just a placeholder for now.
User.bySciper = function(sciper) { return new User() };
_.extend(User.prototype, {
  canEdit: function(whom) { return true; }
});

/* User search.
 *
 * TODO: LDAP searches should be on-demand only; the default intent when typing
 * in the user search box is to see only users already known in the database.
 */
if (Meteor.isServer) {
  var ldapContext = Meteor.npmRequire('epfl-ldap')();
  var getSyncUserByName = Meteor.wrapAsync(ldapContext.users.searchUserByName);

  User.Search.publish(function (query) {
    var self = this;

    if (query.length < 3) {
      self.stop();
      return;
    }

    if (! Devsupport.isOnline()) {
      return Devsupport.fakeData.searchUsers(query, self);
    }
    getSyncUserByName(query).forEach(function (result) {
      self.added(result.sciper, {fullName: result.displayName});
    });
    self.stop();
  });
}

if (Meteor.isClient) {
  Template.userSearchBox.helpers({
    users: _.bind(User.Search.results.find, User.Search.results, {}),
    isLoading: _.bind(User.Search.isLoading, User.Search),
    messageCode:   function() {
      var status = User.Search.status.get();
      if (! status || status.status === "nosearchyet") {
        return;
      } else if (status.status === "OK") {
        return status.resultCount ? undefined: "search#nosearchresults";
      } else {
        return "search#" + (status.message || status.error || status.status);
      }
    }
  });

  Template.userEdit.events({
    "submit form": function(e) {
      console.log(this);
      return false;
    }
  });

  Template.userSearchBox.onRendered(function () {
    var userSearchBox = $(this.find(".selection.dropdown"));
    userSearchBox.dropdown();

    // Reach into the innards of the dropdown module to wire it with Meteor
    var module = userSearchBox.data().moduleDropdown;
    module.filter = function(query) {
      if (query) User.Search.search(query);
    };
    Tracker.autorun(function() {
      var status = User.Search.status.get();
      if (! status) {
        module.set.loading();
      } else {
        module.remove.loading();
        if (status.status !== "nosearchyet") module.show();
      }
   });
  });
}
