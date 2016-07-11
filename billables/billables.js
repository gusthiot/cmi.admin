Billables = new Meteor.Collection("billables");

Billables.columns =
  ["type", "operatedByUser", "billableToAccount", "billableToProject",
   "startTime", "billingDetails", "discount", "validationState"];

function makeTable() {
  return new Tabular.Table({
    name: "Billables",
    collection: Billables,
    columns: _.map(Billables.columns, function(colSymbol) {
      return {
        data: colSymbol,
        title: TAPi18n.__("Billables.column." + colSymbol),
        defaultContent: "-",
        tmpl: Meteor.isClient && Template["Billable$cell$" + colSymbol]
      };
    }),
    language: Tabular.Translations.getCurrent(),
    // http://datatables.net/extensions/select/examples/initialisation/cells.html
    select: {
      style: "os",
      items: "cell"
    },
  });
}

if (Meteor.isServer) {
  // Called only once
  makeTable();
} else if (Meteor.isClient) {
  // Reactively called multiple times e.g. when switching languages
  Template.Billables$Edit.helpers({makeTable: makeTable});
}

/* Table cell I18N */
if (Meteor.isClient) {
  Template.Billable$cell$type.helpers({translateCategory: function(category) {
    return TAPi18n.__("Billables.category." + category);
  }});
}

/* Table edition */
if (Meteor.isClient) {
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
}
