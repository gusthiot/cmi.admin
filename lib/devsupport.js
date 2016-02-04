/**
 * Make development easier.
 */

function isDevelopment() {
  if (Meteor.isClient) {
    return Boolean(document.location.host.startsWith("localhost"));
  } else {
    return process.env.NODE_ENV !== "production";
  }
}


var isDevelopmentCached = undefined;

Devsupport = {
  isActive: function () {
    if (isDevelopmentCached === undefined) {
      isDevelopmentCached = isDevelopment();
    }
    return isDevelopmentCached;
  }
};


Meteor.startup(function () {
  if (Devsupport.isActive()) {
    console.log("Development mode active");
  }
});
