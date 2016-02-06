/**
 * Model for users
 */

User = function(doc) {
  _.extend(this, doc);
};

Users = new Mongo.Collection("users");

UserSearch = new Search("user.search");

if (Meteor.isServer) {

  var ldapContext = Meteor.npmRequire('epfl-ldap')();
  var getSyncUserByName = Meteor.wrapAsync(ldapContext.users.searchUserByName);

  UserSearch.publish(function (query) {
    var self = this;

    if (query.length < 3) {
      self.stop();
      return;
    }

    if (Devsupport.isOnline()) {
      getSyncUserByName(query).forEach(function (result) {
        self.added(result.sciper, {link: "http://foo/bar", fullName: result.displayName});
      });
    }
    Meteor.setTimeout(function () {
      self.added(3, {link: "http://foo/quux", fullName: "Last Guy"});
      self.stop();
    }, 1000);
  });
}

if (Meteor.isClient) {
  function boldifyMatchText(matchText, regExp) {
      return matchText.replace(regExp, "<b>$&</b>");
  }

  Template.userSearchResult.helpers({
    getUsers: _.bind(UserSearch.results.find, UserSearch.results, {}),
    isLoading: _.bind(UserSearch.isLoading, UserSearch)
  });

  Template.userSearchBox.events({
    "keyup #search-box": function(e) {
      UserSearch.search($(e.target).val().trim());
    }
  });

  Template.userLink.events({
    "click a": function (e) {
      $("#userdetails-" + this._id).toggle();
      return false;
    },
    "submit form": function(e) {
      console.log(this);
      return false;
    }
  });
}
