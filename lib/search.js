/**
 * Search-as-you-type support.
 *
 * Inspired from meteorhacks:search-source, but uses a subscription instead of
 * a call. Streams results, signals end of search with success or error.
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
          added: _.bind(self.added, self, searchSelf._resultsChannelName),
          /**
           * Callback says there will be no more search results.
           *
           * @param opt_error
           */
          stop: function(opt_error) {
            // .stop() normally empties the collection, which is undesired
            // on the client side (that would blank the search results):
            var wasSending = self._session._isSending;
            try {
              self._session._isSending = false;
              self.stop(opt_error);
            } finally {
              self._session._isSending = wasSending;
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
      // Purge any previous search results now, but *don't* refresh
      // the view. The first message (result or "nosub") trickling
      // back will take care of it.
      self.results._collection.remove({}, function (err, result) {
        Meteor.subscribe(self.name, text, {
          onStop: function (maybeError) {
            self.status.set(maybeError || {status: "OK"});
          }});
      });
    },
    isLoading: function isLoading() {
      return ! this.status.get();
    }
  });
}
