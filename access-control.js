/**
 * Access control concerns
 */
Meteor.startup(function() {
  Tequila.options.bypass.push("/images/");
});

Tequila.options.request = ["displayname", "uniqueid"];
Tequila.options.getUserId = function getUserId(tequilaResponse) {
  return Meteor.users.findOne({_id: tequilaResponse.uniqueid});
};
