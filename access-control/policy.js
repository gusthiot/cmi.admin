/**
 * Access control policy for the CMI-Admin application
 */

function onOneself(subject, object) {
  return subject._id === object._id;
}

Meteor.startup(function () {
  Policy.edict({
    canReadOwnFullName: Role.Customer,
    canSearchUsers: Policy.anyLoggedInUser,
    canBecomeAnotherUser: Role.SuperAdministrator,
    canReadUserBasicDetails: Role.SuperAdministrator,  // TODO: overkill
    editUser: Policy.Builder.UpdateSchema(Users.collection, [
      Policy.Builder(Role.SuperAdministrator).then(Users.collection.schema),
      Policy.Builder(Policy.anyLoggedInUser).when(onOneself)
        .then(Users.collection.schema.pick(["password"]))
    ])
  });
});

/**
 * @constructor
 */
Role = function(name) { this.name = name };

Role.prototype.policy = function(user) {
  return this.isAssignedToUser(user);
};

Role.SuperAdministrator = new Role("SuperAdministrator");
Role.SuperAdministrator.isAssignedToUser = function(user) {
  return (user._id === "243371"       // Dominique Quatravaux
  || user._id === "138027"  // Christophe Gusthiot
  || user._id === "133333");  // Philippe Langlet
};

Role.Customer = new Role("Customer");   // TODO: Should be one such role per
                                        // customer account
Role.Customer.isAssignedToUser = function(user) {
    return (user._id === "203491"       // Joffrey Pernollet
        || user._id === "251551");  // Remy Juttin
};
