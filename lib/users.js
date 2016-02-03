/**
 * Model for users
 */

User = function(doc) {
  _.extend(this, doc);
};

Users = new Mongo.Collection("users");

if (Meteor.isServer) {
  var ldapjs = Meteor.npmRequire('ldapjs');

  SearchSource.defineSource('users', function(searchText, options) {
    if(searchText.length >= 3) {
      return [
        {_id: 1, link: "http://foo/bar", fullName: "John Doe"},
        {_id: 2, link: "http://foo/baz", fullName: "Jane Roe"},
        {_id: 3, link: "http://foo/quux", fullName: "Wade"}
      ];
    } else {
      return [];
    }
  });
}

if (Meteor.isClient) {
  UserSearch = new SearchSource('users',
    ['fullName', 'link'],
    {
      keepHistory: 1000 * 60 * 5,
      localSearch: true
    });

  Template.searchResult.helpers({
    getUsers: function() {
      return UserSearch.getData({
        transform: function(matchText, regExp) {
          return matchText.replace(regExp, "<b>$&</b>")
        },
        sort: {isoScore: -1}
      });
    },

    isLoading: function() {
      return UserSearch.getStatus().loading;
    }
  });

  Template.searchResult.rendered = function() {
    UserSearch.search('');
  };

  Template.searchBox.events({
    "keyup #search-box": _.throttle(function(e) {
      var text = $(e.target).val().trim();
      UserSearch.search(text);
    }, 200)
  });
}
