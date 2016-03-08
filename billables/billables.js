Billables = new Meteor.Collection("billables");

Billables.columns = function() {
  var columns = [];
  _.each(["type", "operatedByUser", "billableToAccount", "billableToProject",
         "startTime", "billingDetails", "discount", "validationState"],
        function(columnType) {
          columns.push({
            data: columnType,
            title: "Billables.column." + columnType,
            defaultContent: "-",
            tmpl: Meteor.isClient && Template["Billable$cell$" + columnType]
          });
        });
  return columns;
};

Billables.Table = new Tabular.Table({
  name: "Billables",
  collection: Billables,
  columns: Billables.columns()
});
