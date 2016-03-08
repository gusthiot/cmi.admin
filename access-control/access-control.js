/**
 * Access control concerns
 */

/**** Policy edicted *********/


Role = function() {};

Role.SuperAdministrator = new Role();
Role.SuperAdministrator.belongsToUser = function(user) {
  return (user._id === "243371"       // Dominique Quatravaux
          || user._id === "133333");  // Philippe Langlet
};

Role.Customer = new Role();   // TODO: Should be one such role per customer account
Role.Customer.belongsToUser = function(user) {
  return true;
};

Policy = {
  canReadOwnFullName: isLoggedIn,
  canSearchUsers: isLoggedIn,
  canBecomeAnotherUser: function(user) {
    return userHasRole(user, Role.SuperAdministrator);
  },
  canReadUserBasicDetails: function(user) {
    return userHasRole(user, Role.SuperAdministrator);  // TODO: overkill
  }
};

/**** Policy mechanisms *********/

function isLoggedIn(user) {
  return !! user
}

Meteor.startup(function () {
  User.prototype.hasRole = function(role) {
    var user = this;
    var result = role.belongsToUser(user);
    if (result) {
      user.__access_controlled = true;   // No WeakSet's in Meteor's ancient node
    }
    return result;
  };

  /**
   * Return the *effective* user.
   */
  User.current = function() {
    return Meteor.user();
  }
});

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

/**** Enforcing Tequila policy *********/

Meteor.startup(function() {
  Tequila.options.bypass.push("/images/");
});

// SCIPER is the _id of documents in Meteor.users:
Tequila.options.getUserId = function getUserId(tequilaResponse) {
  return Meteor.users.findOne({_id: tequilaResponse.uniqueid});
};

function signalServerError(module) {
  var i18nClass = module + "Error";  // i.e. TequilaError, BecomeError
  return function(error) {
    if (! error) return;
    var i18nKey = (error instanceof Meteor.Error) ? error.error : String(error);
    alert(TAPi18n.__("AccessControl." + i18nClass + "." + i18nKey));
  };
}

Tequila.options.onServerError = signalServerError("Tequila");

/**** Enforcing policy to become another user *********/

if (Meteor.isClient) {
  Template.AccessControl$WhoAmI.helpers({
    user: function() { return Meteor.user() },
    canBecome: function() {
      return Policy.canBecomeAnotherUser(Meteor.user());
    },
    hasBecome: function() { return false }
  });
}

Become.policy(function(uid_from, uid_to) {
  return Policy.canBecomeAnotherUser(getUser(uid_from));
});

/**** Enforcing policy on publishes *********/

Policy.ensure = function(user_id, policy /*, *args */) {
  check(policy, Function);
  var user = getUser(user_id);
  if (! user) {
    throw new Meteor.Error("DeniedByPolicy");
  }
  var policyArgs = Array.prototype.slice.call(arguments, 2);
  policyArgs.unshift(user);
  if (! policy.apply({}, policyArgs)) {
    throw new Meteor.Error("DeniedByPolicy");
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

Template.User$Pick.events({
  'user:selected #AccessControlBecomeThisUser': function(event, that, id) {
    Become.become(id, signalServerError("Become"));
    event.preventDefault();
  },
  'click #unbecome': Become.restore
});

Template.AccessControl$WhoAmI.helpers({
  hasBecome: function() {
    return !! Become.realUserID();
  },
  realUser: function() {
    return Meteor.users.findOne({_id: Become.realUserID()});
  }
});
