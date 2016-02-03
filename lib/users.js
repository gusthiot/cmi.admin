/**
 * Model for users
 */

User = function(doc) {
  _.extend(this, doc);
};

Users = new Mongo.Collection("users");

SearchSource.defineSource('users', function(searchText, options) {
  var options = {sort: {isoScore: -1}, limit: 20};

  if(searchText.length >= 3) {
    
  } else {
    return [];
  }
});

function buildRegExp(searchText) {
  // this is a dumb implementation
  var parts = searchText.trim().split(/[ \-\:]+/);
  return new RegExp("(" + parts.join('|') + ")", "ig");
}

UserSearch = new SearchSource('users',
  ['packageName', 'description'],
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
    PackageSearch.search(text);
  }, 200)
});