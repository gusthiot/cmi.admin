/**
 * Search-as-you-type support.
 *
 * Inspired from meteorhacks:search-source, but uses a subscription instead of
 * a call. Streams results. Signals end of search with success or error.
 * Throttles searches to match the server-side speed.
 */

Search = function Search(name) {
  this.name = name;
  this._resultsChannelName = name + ".results";
  if (Meteor.isClient) {
    var self = this;
    self.results = new Mongo.Collection(this._resultsChannelName);

    // Refrain from reading our own ReactiveVar – This causes infinite loops!
    var status = {status: "nosearchyet"};
    self._status = function(opt_newStatus) {
      if (arguments.length) {
        status = opt_newStatus;
        self.status.set(status);
      } else {
        return status;
      }
    };
    self.status = new ReactiveVar(status);
  }
};

if (Meteor.isServer) {
  _.extend(Search.prototype, {
    publish: function publish(callback) {
      var searchSelf = this;
      Meteor.publish(searchSelf.name, function (/* args */) {
        var self = this;

        var thisForCallback = {
          /**
           * Callback hands out a search result
           *
           * @param id
           * @param document
           */
          added: _.bind(self.added, self, searchSelf._resultsChannelName),
          changed: _.bind(self.changed, self, searchSelf._resultsChannelName),
          removed: _.bind(self.removed, self, searchSelf._resultsChannelName),
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
        return callback.apply(thisForCallback, arguments);
      });
    }
  });
}

if (Meteor.isClient) {
  _.extend(Search.prototype, {
    search: function search(/* args */) {
      var queryArgs = Array.prototype.slice.apply(arguments);
      var self = this;
      if (! self._status()) {
        // Search already in progress; buffer it (one slot in buffer)
        self._queued = queryArgs;
        return;
      }
      self._status(undefined);
      // Purge any previous search results now, but *don't* refresh
      // the view. The first message (result or "nosub") trickling
      // back will take care of it.
      self.results._collection.remove({}, function (err, result) {
        if (err) {
          self._status(err);
        } else {
          var subscribeArgs = [self.name].concat(queryArgs);
          subscribeArgs.push({
            onStop: function (maybeError) {
              var status = maybeError ? _.clone(maybeError) : {status: "OK"};
              status.resultCount = self.results._collection.find({}).count();
              self._status(status);
              if (! maybeError && self._queued !== undefined) {
                var queued = self._queued;
                self._queued = undefined;
                self.search.apply(self, queued);
              }
            }});

          Meteor.subscribe.apply(self, subscribeArgs);
        }
      });
    },
    isLoading: function isLoading() {
      return ! this._status();
    }
  });
}
