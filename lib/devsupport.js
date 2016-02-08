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
    searchUsers: function (search) {
      search.added("12345", {fullName: "Jean Bon"});
      search.added("12346", {fullName: "Jean Bonneau"});
      search.added("12348", {fullName: "Jean Darme"});
      search.added("12347", {fullName: "Jean Fume"});
      Meteor.setTimeout(function () {
        search.added(3, {fullName: "Last Guy"});
        search.stop();
      }, 1000);
    }
  };
} 
