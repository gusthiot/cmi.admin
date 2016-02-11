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

var uniqueStem;
function open(searchName) {
  var statusReactive = new ReactiveVar();

  // Refrain from reading our own ReactiveVar – This causes infinite loops!
  var _status;
  function status(opt_newStatus) {
    if (arguments.length) {
      _status = opt_newStatus;
      statusReactive.set(_status);
    } else {
      return _status;
    }
  }

  status({status: "nosearchyet"});

  var channelNameBase = searchName + ".results", channelName;
  if (uniqueStem === undefined) {
    channelName = channelNameBase;
    uniqueStem = 0;
  } else {
    channelName = channelNameBase + "." + uniqueStem++;
  }
  var results = new Mongo.Collection(channelName);

  var queuedQuery;
  function search(/* queryArgs */) {
    var queryArgs = Array.prototype.slice.apply(arguments);
    if (! status()) {
      // Search already in progress; queue it (one slot in queue)
      queuedQuery = queryArgs;
      return;
    }
    status(undefined);
    // Purge any previous search results now, but *don't* refresh
    // the view. The first message (result or "nosub") trickling
    // back will take care of it.
    results._collection.remove({}, function (err, result) {
      if (err) {
        status(err);
      } else {
        var subscribeArgs = [searchName, channelName].concat(queryArgs);
        subscribeArgs.push({
          onStop: function (maybeError) {
            var statusStruct = maybeError ? _.clone(maybeError) : {status: "OK"};
            statusStruct.resultCount = results._collection.find({}).count();
            status(statusStruct);
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
      return !status();
    },
    search: search,
    status: statusReactive
  };
};
