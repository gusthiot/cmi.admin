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
