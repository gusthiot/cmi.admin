/**
 * Search-as-you-type support.
 *
 * Like meteorhacks:search-source, only smarter: streams results, signals end
 * of search with success or error.
 */

Search = function Search(name) {
  this.name = name;
  if (Meteor.isClient) {
    this.status = new ReactiveVar({status: "nosearchyet"});
    this.results = new Mongo.Collection(name + ".results");
  }
};

if (Meteor.isServer) {
  _.extend(Search.prototype, {
    publish: function publish(callback) {
      var self = this;
      Meteor.publish(self.name, function (query) {
        var self = this;
        // TODO: bad hack. interpose some kind of delta store instead
        self.removed = function() {};
        return callback.call(self, query);
      });
    }
  });
}

if (Meteor.isClient) {
  _.extend(Search.prototype, {
    search: function search(text) {
      var self = this;
      self.status.set(undefined);
      // TODO: bad hack.
      self.results._collection.remove({}, function(err, result) {
        Meteor.subscribe("user.search", text, {
          onStop: function (maybeError) {
            self.status.set(maybeError || {status: "OK"});
          }
        });
      });
    },
    isLoading: function isLoading() {
      return ! this.status.get();
    }
  });
}
