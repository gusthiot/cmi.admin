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
   * @return False if on the bus (or at home and off the VPN)
   */
  isOnline: _.memoize(function() {
    if (Meteor.isClient) {
      throw new Error("Client shouldn't know or care whether server is online.");
    }

    var Socket = Npm.require('net').Socket,
      Future = Npm.require('fibers/future');

    var ret = new Future();
    var sock = new Socket();
    var timeout;

    function done(status) {
      if (sock) sock.destroy();
      if (timeout) clearTimeout(timeout);
      ret.return(status);
    }

    sock.connect({host: "ldap.epfl.ch", port: 389});
    sock.on('connect', function() { done(true); });
    sock.on('error', function() { done(false); });
    timeout = setTimeout(function() { done(false); }, 5000);
    
    return ret.wait();
  })
};

if (Devsupport.isActive()) {
  console.log("Development mode active");
}
if (Meteor.isServer && ! Devsupport.isOnline()) {
  console.log("Don't drive and code!");
  if (Meteor.settings && Meteor.settings.devsupport &&
      Meteor.settings.devsupport.fakeTequilaServer) {
    Tequila.options.fakeLocalServer =
      Meteor.settings.devsupport.fakeTequilaServer;
  }
}

Devsupport.fakeData = {
  ldapUsers: function (search, query) {
    if (query === "ERROR") {
      search.stop({status: "error", message: "Sum ting wong"});
      return;
    }
    var names = ["Jean Bon", "Jean Bonneau", "Jean Darme", "Jean Fume",
      "Jean Fourne"];
    var sciper = 12345;
    var resultCount = query.length >= 6 ? 1: query.length == 5 ? 2 :
      query.length == 4 ? 4 : 8;
    for(var i = 0; i < resultCount; ++i) {
      search.added(String(sciper),
        {ldapFullName: names[sciper % names.length] + " (LDAP)"});
      sciper++;
    }
    Meteor.setTimeout(function () {
      search.added("3", {fullName: "Last Guy"});
      search.stop();
    }, 1000);
  }
};

Debug = Meteor.isServer ? require("debug") :
  (function(){ return function(){} });

if (Meteor.isClient) {
  Meteor.startup( function () {
    // http://stackoverflow.com/questions/498469/jquery-assertion-support-defensive-programming    $.fn.assertSizeEquals = function(size) {
    $.fn.assertSizeEquals = function (size) {
      if (this.length != size) {
        alert( "Expected " + size + " elements, but got " + this.length + "." );
      }
      return this;
    };
    $.fn.assertSizeAtLeast = function (size) {
      if (this.length < size) {
        alert( "Expected at least " + size + " elements, but got " + this.length + "." );
      }
      return this;
    };
  } );
}
