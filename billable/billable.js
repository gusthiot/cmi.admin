function __(key) {
  if (Meteor.isServer) {
    return key;
  } else {
    return TAPi18n.__(key);
  }
}

Billables = new Meteor.Collection("billables");

Billables.columns = function() {
  var columns = [];
  _.each(["type", "operatedByUser", "billableToAccount", "billableToProject",
         "startTime", "billingDetails", "discount", "validationState"],
        function(columnType) {
          columns.push({
            data: columnType,
            title: __("Billables#column#" + columnType),
            defaultContent: "-"
          });
        });
  return columns;
};

Billables.Table = Tabular.newReactiveTable({
  name: "Billables",
  collection: Billables,
  columns: Billables.columns,
  _unused: [
    {
      tmpl: Meteor.isClient && Template.Billable$LineActions
    }
  ]
});
