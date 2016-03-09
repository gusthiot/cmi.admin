var debug = Debug("lib/policy.js");

/**
 * Policy class
 *
 * This class makes it very easy to edict the application's security policy
 * in a concise way (see ../access-control/policy.js).
 *
 * @constructor
 */
Policy = function Policy() {};

Policy.prototype.isAllowed = function(user_or_uid /*, *args */) {
  var user = getUser(user_or_uid);
  if (! user) {
    // We could easily accomodate policies that also grant access to logged-out
    // users (by using some kind of property maybe); but in this particular
    // app, this is not (yet) a requirement.
    return false;
  }
  var policyArgs = Array.prototype.slice.call(arguments, 2);
  policyArgs.unshift(user);
  var policyResult = this.checkFunc.apply({}, policyArgs);
  if (! policyResult) {
    debug(this.name + " denied by policy for user " + user._id);
    return false;
  } else {
    return true;
  }
};

Policy.prototype.check = function(user_or_uid /*, *args */) {
  if (! this.isAllowed.apply(this, arguments)) {
    throw new Meteor.Error("DeniedByPolicy");
  }
};

function getUser(user_or_uid) {
  if (! user_or_uid) { return; }
  if (user_or_uid instanceof User) {
    return user_or_uid;
  } else {
    return User.collection.findOne({_id: user_or_uid});
  }
}

Policy.edict = function(dict) {
  _.each(dict, function(value, key) {
    if (value instanceof Policy) {
      value = value.checkFunc;
    }
    Policy[key] = new Policy();
    Policy[key].name = key;
    Policy[key].checkFunc = value;
  });
};

Policy.edict({anyLoggedInUser: function(user) {return !!user}});

