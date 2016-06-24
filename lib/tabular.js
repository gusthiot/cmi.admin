/**
 * Enhancements to aldeed:meteor-tabular
 */

if (Meteor.isClient) {
  /* Monkey-patch to work around bugs #281 and #282 */
  Template.tabular.onRendered(function() {
    this.tabular.isLoading = {
      get: function() { return false; },
      set: function() {}
    }
  });
}

/* Import the extensions we use */
if (Meteor.isClient) {
  Meteor.startup(function(){
    require("./tabular/imports/dataTables.select.js")(window, $);
  });
}
