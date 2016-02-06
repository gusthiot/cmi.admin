/**
 * Search-as-you-type support.
 *
 * Like meteorhacks:search-source, only smarter: streams results, signals end
 * of search with success or error.
 */

Search = function Search(name) {
  this.name = name;
  this._resultsChannelName = name + ".results";
  if (Meteor.isClient) {
    this.status = new ReactiveVar({status: "nosearchyet"});
    this.results = new Mongo.Collection(this._resultsChannelName);
  }
};

if (Meteor.isServer) {
  _.extend(Search.prototype, {
    publish: function publish(callback) {
      var searchSelf = this;
      Meteor.publish(searchSelf.name, function (query) {
        var self = this;

        var thisForCallback = {
          /**
           * Callback hands out a search result
           *
           * @param id
           * @param document
           */
          added: function(id, document) {
            // TODO: This is only correct during the first search.
            return self.added(searchSelf._resultsChannelName, id, document);
          },
          /**
           * Callback says there will be no more search results.
           *
           * @param opt_error
           */
          stop: function(opt_error) {
            // Block default behavior of purging subscription on .stop()
            var removedOrig = self.removed;
            try {
              self.removed = function() {};
              self.stop(opt_error);
            } finally {
              self.removed = removedOrig;
            }
          }
        };
        return callback.call(thisForCallback, query);
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


