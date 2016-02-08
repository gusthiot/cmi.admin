/**
 * Make development easier.
 */

Devsupport = {
  isActive: _.memoize(function () {
      if (Meteor.isClient) {
        return Boolean(document.location.host.startsWith("localhost"));
      } else {
        return process.env.NODE_ENV !== "production";
      }
  }),
  /**
   * @return False if on the bus
   */
  isOnline: _.memoize(function() {
    if (Meteor.isClient) {
      throw new Error("Client shouldn't know or care whether server is online.");
    }
    var status = Execute.spawn("ping", ["-c", "1", "8.8.8.8"]).wait();
    return status.code === 0;
  })
};

Meteor.startup(function () {
  if (Devsupport.isActive()) {
    console.log("Development mode active");
  }
  if (Meteor.isServer && ! Devsupport.isOnline()) {
    console.log("Don't drive and code!");
  }
});

if (Meteor.isServer) {
  Devsupport.fakeData = {
    searchUsers: function (query, search) {
      var resultCount = query.length >= 6 ? 1: query.length == 5 ? 2 :
        query.length == 4 ? 4 : 8;
      var firstSciper = 12345;
      var names = ["Jean Bon", "Jean Bonneau", "Jean Darme", "Jean Fume"];
      for(var i = 0; i < resultCount; ++i) {
        var sciper = firstSciper + i;
        search.added(String(sciper), {fullName: names[sciper % names.length]});
      }
      Meteor.setTimeout(function () {
        search.added("3", {fullName: "Last Guy"});
        search.stop();
      }, 1000);
    }
  };
} 
