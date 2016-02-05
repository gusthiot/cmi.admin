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
