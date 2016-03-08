/**
 * Access control concerns
 */
Meteor.startup(function() {
  Tequila.options.bypass.push("/images/");
});

// SCIPER is the _id of documents in Meteor.users:
Tequila.options.getUserId = function getUserId(tequilaResponse) {
  return Meteor.users.findOne({_id: tequilaResponse.uniqueid});
};

Role = function() {};

Role.SuperAdministrator = new Role();
Role.SuperAdministrator.belongsToUser = function(user) {
  return (user._id === "243371"       // Dominique Quatravaux
          || user._id === "133333");  // Philippe Langlet
}

Role.Customer = new Role();   // TODO: Should be one such role per customer account
Role.Customer.belongsToUser = function(user) {
  return true;
};

Meteor.startup(function () {
  User.prototype.hasRole = function(role) {
    var user = this;
    var result = role.belongsToUser(user);
    if (result) {
      user.__access_controlled = true;   // No WeakSet's in Meteor's ancient node
    }
    return result;
  };

  User.prototype.ensureHasRole = function(role) {
    if (! this.hasRole(role)) {
      throw new Meteor.Error("permissionDenied");
    }
  };
  /**
   * Return the *effective* user.
   */
  User.current = function() {
    return Meteor.user();
  }
});

if (Meteor.isClient) {
  Template.AccessControl$WhoAmI.helpers({
    user: function() { return Meteor.user() },
    canBecome: function() {
      return Policy.canBecomeAnotherUser(Meteor.user());
    },
    hasBecome: function() { return false }
  });
}

function getUser(user_or_uid) {
  if (! user_or_uid) { return; }
  if (user_or_uid instanceof User) {
    return user_or_uid;
  } else {
    return User.collection.findOne({_id: user_or_uid});
  }
}

function userHasRole(user_or_uid, role) {
  var user = getUser(user_or_uid);
  return user ? user.hasRole(role) : false;
}

Policy = {
  canReadOwnFullName: function(user) { return !! user; },
  canBecomeAnotherUser: function(user) {
    return userHasRole(user, Role.SuperAdministrator);
  }
};

Policy.publishConditional = function(policy, resultsFunc) {
  if (! Meteor.isServer) return;

  Meteor.publish(null, function() {
    if (! policy(this.userId)) return;
    var user = Meteor.users.findOne({_id: this.userId});
    return resultsFunc(user);
  });
};

if (! Meteor.isClient) return; /******************************************/
