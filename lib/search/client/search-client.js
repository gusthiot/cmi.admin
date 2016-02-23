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
      return channelNameBase;
      uniqueStem = 0;
    } else {
      return channelNameBase + "." + uniqueStem++;
    }
  }  
})();

/**
 * @constructor
 *
 * The reactive status of a search.
 */
var SearchState = function() {
  var status = {status: "nosearchyet"},
    statusReactive = new ReactiveVar(status);

  /* In order to preserve proper reactive semantics:
   * + readers MUST read from the ReactiveVar every time
   *   (lest they miss updates when the value changes);
   * + writers MUST NOT read (as that can cause an infinite loop).
   */

  this.reader = function reader() {
    return statusReactive.get();
  }

  this.writer = {
    get: function() {
      return status;
    },
    set: function(newVal) {
      status = newVal;
      statusReactive.set(newVal);
    },
  }
};

function open(searchName) {
  var __state = new SearchState,
    channelName = newChannelName(searchName),
    results = new Mongo.Collection(channelName);

  var queuedQuery;
  function search(/* queryArgs */) {
    var state = __state.writer;
    var queryArgs = Array.prototype.slice.apply(arguments);
    if (! state.get()) {
      // Search already in progress; queue it (one slot in queue)
      queuedQuery = queryArgs;
      return;
    }
    state.set(undefined);
    // Purge any previous search results now, but *don't* refresh
    // the view. The first message (result or "nosub") trickling
    // back will take care of it.
    results._collection.remove({}, function (err, result) {
      if (err) {
        state.set(err);
      } else {
        var subscribeArgs = [searchName, channelName].concat(queryArgs);
        subscribeArgs.push({
          onStop: function (maybeError) {
            var statusStruct = maybeError ? _.clone(maybeError) : {status: "OK"};
            statusStruct.resultCount = results._collection.find({}).count();
            state.set(statusStruct);
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

  var state = __state.reader;
  return {
    find: _.bind(results.find, results),
    isLoading: function isLoading() {
      return !state();
    },
    search: search,
    status: state
  };
};
