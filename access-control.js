/**
 * Access control concerns
 */
Meteor.startup(function() {
  Tequila.options.bypass.push("/images/");
  LoginFirst.allowedMethodNames = ["tequila.authenticate"];
});
