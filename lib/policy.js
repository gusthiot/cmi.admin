var debug = Debug("lib/policy.js");

/**
 * Policy module
 *
 * Instances of the PolicyBase class and its subclasses model the process of
 * answering policy questions, framed thusly:
 *
 * + is subject U allowed to do X?
 *
 * + what actions (e.g.: Mongo inserts or updates, method calls) is subject U
 *   allowed to perform on object O, under conditions ("labels") {K1: V1, ...}?
 *
 * This class makes it very easy to edict and then review the application's
 * security policy (see ../access-control/policy.js).
 *
 * Subjects are always users - Instances of the Meteor.users class.
 */

Policy = {};

/**
 * Edict the policy.
 *
 * This is supposed to be called exactly once.
 */
Policy.edict = function(dict) {
  _.each(dict, function(value, key) {
    var builder = Policy.Builder(value),
      clazz = builder.type || PolicyBase;
    var policy = Policy[key] = new clazz(key, builder.policy);
    if (Meteor.isServer && policy.enforce) {
      policy.enforce();
    }
  });
};

Policy.anyLoggedInUser = function(user) {return !!user};
Policy.deny = function() {};

// TODO: publish policy entries should have their own subclass
PolicyBase.prototype.publish = function(name, publishFunc) {
  if (! Meteor.isServer) return;

  var policy = this;

  Meteor.publish(name, function(/* args */) {
    if (! policy.isAllowed(this)) {
      debug("Policy " + policy.name + " denies publish to " + this.userId);
      return;
    }
    return publishFunc.apply({userId: this.userId}, arguments);
  });
};

/**
 * An instance of PolicyBase represents one policy rule with a yes/no outcome.
 *
 * @constructor
 */
function PolicyBase(name, policyFunc) {
  this.name = name;
  this.policy = policyFunc;
};

PolicyBase.prototype.call = function(/* opt_publish_that, *args */) {
  var args = Array.prototype.slice.call(arguments);
  var user;
  if (Meteor.isClient) {
    user = Meteor.user();
  } else if ((args[0] instanceof Object) && ("userId" in args[0])) {
    user = Meteor.users.findOne({_id: args.shift().userId});
  } else {
    throw new Error("Policy call(): on server, need to pass the publish \"this\"" +
      " as the first argument (or use policy.publish())");
  }
  if (! user) {
    // We could easily accomodate policies that also grant access to logged-out
    // users (by using some kind of property maybe); but there is no need in
    // this app yet.
    return false;
  }
  args.unshift(user);
  return this.policy.apply({}, args);
};

PolicyBase.prototype.isAllowed = function(/* *args */) {
  return !! this.call.apply(this, arguments);
};

PolicyBase.prototype.check = function(/* *args */) {
  if (! this.isAllowed.apply(this, arguments)) {
    throw new Policy.Error();
  }
};

/**
 * An instance of PolicyUpdateSchema represents one policy rule that matches
 * a proposed MongoDB update against a SimpleSchema.
 *
 * The client can query the policy to display the proper form and provide
 * client-side validation (using aldeed:autoform or otherwise). On the server
 * side, policy enforcement is automatic.
 *
 * @constructor
 */
function PolicyUpdateSchema(name, policyFunc) {
  PolicyBase.call(this, name, policyFunc);
}

PolicyUpdateSchema.prototype = Object.create(PolicyBase.prototype);

PolicyUpdateSchema.prototype.call = function() {
  var schema = PolicyBase.prototype.call.apply(this, arguments);
  if (! schema) return;
  return schema.omit("_id");
};

/**
 * @constructor
 */
var PolicyBuilder = function(policyFunc) {
  this.policy = policyFunc;
};

Policy.Builder = function(from) {
  if (from instanceof PolicyBuilder) {
    var clone = Object.create(PolicyBuilder.prototype);
    _.extend(clone, from);  // TODO: should be .extendOwn, but
                            // underscore first needs upgrading
    return clone;
  } else if (from instanceof Function) {
    return new PolicyBuilder(from);
  } else if (from instanceof Array) {
    return Policy.Builder.firstMatch(from);
  } else if (from && from.policy) {
    return new Policy.Builder(function(/* args */) {
      return from.policy.apply(from, arguments);
    });
  } else {
    throw new Error("Unknown parameter type to Policy.Builder: " + from);
  }
};

function buildAnd(builder1, builder2) {
  return new PolicyBuilder(function(/* args */) {
    if (! builder1.policy.apply({}, arguments)) return;
    return builder2.policy.apply({}, arguments);
  });
}

Policy.Builder.firstMatch = function(policies) {
  policies = _.map(policies, Policy.Builder);
  return new PolicyBuilder(function(/* args */) {
    var args = Array.prototype.slice.call(arguments);
    var returned;
    _.find(policies, function(builder) {
      returned = builder.policy.apply({}, args);
      return returned;
    });
    return returned;
  });
};

PolicyBuilder.prototype.when = function(morePolicy) {
  return buildAnd(this, Policy.Builder(morePolicy));
};

PolicyBuilder.prototype.then = function(what) {
  return buildAnd(this, Policy.Builder(
    (what instanceof Function) ? what : function() { return what }));
};

Policy.Builder.UpdateSchema = function(collection, what) {
  var builder = Policy.Builder(what);
  builder.type = PolicyUpdateSchema;
  builder.collection = collection;
  return builder;
};

/** @constructor */
Policy.Error = function() {
  Meteor.Error.call(this, "DeniedByPolicy");
};

Policy.Error.prototype = Object.create(Meteor.Error.prototype);
