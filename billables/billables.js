Billables = new Meteor.Collection("billables");

Billables.columns = _.map(
  ["type", "operatedByUser", "billableToAccount", "billableToProject",
   "startTime", "billingDetails", "discount", "validationState"],
  function(columnType) {
    return {
      data: columnType,
      title: "Billables.column." + columnType,  // i18n'd in lib/tabular.js
      defaultContent: "-",
      tmpl: Meteor.isClient && Template["Billable$cell$" + columnType]
    };
  });

Billables.Table = new Tabular.Table({
  name: "Billables",
  collection: Billables,
  columns: Billables.columns,
  // http://datatables.net/extensions/select/examples/initialisation/cells.html
  select: {
    style: "os",
    items: "cell"
  }
});

if (! Meteor.isClient) return; /******************************************/

Template.Billables$Edit.onRendered(function() {
  this.$("table").on('select.dt', function (e, dt, type, indexes) {
    var rowNum = indexes[0].row, colNum = indexes[0].column,
        data = dt.row(rowNum).data(),
        columnDescr = Billables.columns[colNum];
    console.log("Selected " + type + ": " + columnDescr.data + " of _id " + data._id);
  })
  .on('deselect.dt', function (e, dt, type, indexes) {
    
  });
});
