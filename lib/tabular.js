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

if (Meteor.isClient) {
  /* Table column title i18n, inspired by
   * https://github.com/aldeed/meteor-tabular/pull/257 */
  Template.tabular.onRendered(function() {
    var template = this;
    template.autorun(function () {
      var tabularTable = template.tabular.tableDef;

      if (!(tabularTable instanceof Tabular.Table)) {
        throw new Error("You must pass Tabular.Table instance as the table attribute");
      }

      translateColumnTitles(tabularTable, template);
    });
  });
}

function translateColumnTitles(tabularTable, template) {
  var th = template.$('table').find("thead tr th");
  $.each(th, function(index, t) {
    $(t).html(TAPi18n.__(tabularTable.options.columns[index].title));
  });
}


