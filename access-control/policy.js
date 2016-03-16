/**
 * Access control policy for the CMI-Admin application
 */

Meteor.startup(function () {
  Policy.edict({
    canReadOwnFullName: Policy.anyLoggedInUser,
    canSearchUsers: Policy.anyLoggedInUser,
    canBecomeAnotherUser: Role.SuperAdministrator.toPolicy(),
    canReadUserBasicDetails: Role.SuperAdministrator.toPolicy(),  // TODO: overkill
  });
});

/**
 * @constructor
 */
Role = function(name) { this.name = name };

Role.prototype.toPolicy = function() {
  var self = this;
  return new Policy(this.name, {
    check: function (user) {
      return self.belongsToUser(user);
    }
  });
};

Role.SuperAdministrator = new Role("SuperAdministrator");
Role.SuperAdministrator.belongsToUser = function(user) {
  return (user._id === "243371"       // Dominique Quatravaux
          || user._id === "133333");  // Philippe Langlet
};

Role.Customer = new Role("Customer");   // TODO: Should be one such role per
                                        // customer account
Role.Customer.belongsToUser = function(user) {
  return true;
};
