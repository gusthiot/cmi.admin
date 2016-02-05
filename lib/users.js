/**
 * Model for users
 */

User = function(doc) {
  _.extend(this, doc);
};

Users = new Mongo.Collection("users");

if (Meteor.isServer) {
  Meteor.publish("user.search", function (query) {
    var self = this;
    if(query.length < 3) {
      self.stop();
      return;
    }
    self.added("user.search.results", 1, {link: "http://foo/bar", fullName: "John Doe"});
    self.added("user.search.results", 2, {link: "http://foo/quux", fullName: "Jane Roe"});
    Meteor.setTimeout(function () {
      self.added("user.search.results", 3, {link: "http://foo/quux", fullName: "Wade"});
      self.stop();
    }, 1000);
  });
  var ldapjs = Meteor.npmRequire('ldapjs');  // TODO
}

if (Meteor.isClient) {
  function boldifyMatchText(matchText, regExp) {
      return matchText.replace(regExp, "<b>$&</b>");
  }

  // No "var", so that one may do SearchResults.find({}).fetch()
  // from the browser's console, yow!
  SearchResults = new Mongo.Collection("user.search.results");

  Session.set("user.search.done", {status: "nosearchyet"});
  function doUserSearch(text) {
    Session.set("user.search.done", undefined);
    Meteor.subscribe("user.search", text, {
      onStop: function (maybeError) {
        Session.set("user.search.done", maybeError || {status: "OK"});
      }
    });
  }

  Template.userSearchResult.helpers({
    getUsers: function() {
      return SearchResults.find({});
    },

    isLoading: function() {
      return ! Session.get("user.search.done");
    }
  });

  Template.userSearchBox.events({
    "keyup #search-box": _.throttle(function(e) {
      var text = $(e.target).val().trim();
      doUserSearch(text);
    }, 200)
  });
}
