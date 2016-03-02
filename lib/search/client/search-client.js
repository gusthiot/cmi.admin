/**
 * Search-as-you-type support: client side.
 */

Search = function Search(name) {
  this.name = name;

  _.extend(this, {
    /**
     * Open a search channel.
     *
     * @returns {{find: Function, search: Function, isLoading: Function}}
     */
    open: _.bind(open, {}, this.name)
  });
};

/* Support several search boxes in same client */
var newChannelName = (function() {
  var uniqueStem;
  return function newChannelName(searchName) {
    var channelNameBase = searchName + ".results";
    if (uniqueStem === undefined) {
      uniqueStem = 0;
      return channelNameBase;
    } else {
      return channelNameBase + "." + uniqueStem++;
    }
  }  
})();

function open(searchName) {
  var status = new ReactiveVar({status: "nosearchyet"}),
    channelName = newChannelName(searchName),
    results = new Mongo.Collection(channelName);

  var queuedQuery;
  function search(/* queryArgs */) {
    var queryArgs = Array.prototype.slice.apply(arguments);
    // Reading and writing from the same reactive computation causes a loop.
    // search() is generally a writer, do this one read under the radar:
    if (! Tracker.nonreactive(status.get.bind(status))) {
      // Search already in progress; queue it (one slot in queue)
      queuedQuery = queryArgs;
      return;
    }
    status.set(undefined);
    // Purge any previous search results now, but *don't* refresh
    // the view. The first message (result or "nosub") trickling
    // back will take care of it.
    results._collection.remove({}, function (err, result) {
      if (err) {
        status.set(err);
      } else {
        var subscribeArgs = [searchName, channelName].concat(queryArgs);
        subscribeArgs.push({
          onStop: function (maybeError) {
            var statusStruct = maybeError ? _.clone(maybeError) : {status: "OK"};
            statusStruct.resultCount = results._collection.find({}).count();
            status.set(statusStruct);
            if (! maybeError && queuedQuery !== undefined) {
              var queued = queuedQuery;
              queuedQuery = undefined;
              search.apply({}, queued);
            }
          }});

        Meteor.subscribe.apply(Meteor, subscribeArgs);
      }
    });
  }

  return {
    find: _.bind(results.find, results),
    isLoading: function isLoading() {
      return !status.get();
    },
    search: search,
    status: status.get.bind(status)
  };
};
