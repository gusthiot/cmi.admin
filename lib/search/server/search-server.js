/**
 * Search-as-you-type support: server side.
 */


Search = function Search(name) {
  this.name = name;
};

_.extend(Search.prototype, {
  publish: function publish(callback) {
    Meteor.publish(this.name,
      function (clientCollectionName/*, queryParams */) {
        var self = this;
        var queryParams = Array.prototype.slice.call(arguments, 1);

        var thisForCallback = {
          userId: self.userId,
          /**
           * Callback adds a search result
           *
           * @param id
           * @param document
           */
          added: _.bind(self.added, self, clientCollectionName),
          /**
           * Callback changes a search result
           *
           * @param id
           * @param document
           */
          changed: _.bind(self.changed, self, clientCollectionName),
          /**
           * Callback removes a search result
           *
           * @param id
           * @param document
           */
          removed: _.bind(self.removed, self, clientCollectionName),
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
        return callback.apply(thisForCallback, queryParams);
      });
  }
});
