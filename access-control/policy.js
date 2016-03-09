/**
 * Access control policy for the CMI-Admin application
 */

Policy.edict({
  canReadOwnFullName: Policy.anyLoggedInUser,
  canSearchUsers: Policy.anyLoggedInUser,
  canBecomeAnotherUser: function(user) {
    return user.hasRole(Role.SuperAdministrator);
  },
  canReadUserBasicDetails: function(user) {
    return user.hasRole(Role.SuperAdministrator);  // TODO: overkill
  }
});

/**
 * @constructor
 */
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

Meteor.startup(function () {
  User.prototype.hasRole = function(role) { return role.belongsToUser(this); };
});
