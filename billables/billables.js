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
    //http://datatables.net/extensions/select/examples/initialisation/cells.html
/*
    columnDefs: [ {
      orderable: false,
      className: 'select-checkbox',
      targets:   9
    } ],
*/
    select: {
      style: "os",
      items: "cell",
      //selector: 'td:last-child'
    },
/*
    order: [[ 1, 'asc' ]],
*/
    initComplete: function() {
      setupColumnFilterUI(this);
    }
  });
}

function setupColumnFilterUI(dataTableElement) {
  var columns = dataTableElement.api().columns();
  // From https://datatables.net/examples/api/multi_filter_select.html
  columns.every( function () {
    var column = this;

    var translate = function(str) {
      return String(str).toUpperCase(); // XXX Just an example
    };

    var context = {
      index: column.index(),
      type: Billables.columns[column.index()],
      translateType: function(type) {
        return TAPi18n.__("Billables.column." + type)
      },
      sortedValues: [{
        value: "usage_fee", translate: translate
      },
        {value: "reservation_fee", translate: translate
        },
        {value: "access_fee", translate: translate
  }
      ]
    };

    $(column.header()).empty();

    var view = Template.Billable$columnHead.constructView();
    // Event handlers need access to the column object:
    view.templateInstance().dataTable = {
      column: column
    };
    Blaze.renderWithData(view, context, column.header());
  });
}

if (Meteor.isClient) {
  // When selects in column headers change, filter values accordingly
  Template.Billable$columnHead.events({
    'change select': function(event, template) {
      var val = $.fn.dataTable.util.escapeRegex(
          $(event.target).val()
      );
      template.dataTable.column
          .search( val ? '^'+val+'$' : '', true, false )
          .draw();
    }
  });
}

function allValuesInColumn(collection, columnName) {
  return _.sortBy(_.uniq(_.pluck(collection.find({}).fetch(), columnName)), function(t) {return t})
}

var theTable = makeTable();
if (Meteor.isClient) {
  Template.Billables$Edit.helpers({makeTable: theTable});
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


   // example from:
    // http://www.sprymedia.co.uk/dataTables-1.4/example_editable.html
    // http://www.appelsiini.net/projects/jeditable

    /*var oTable;


      /!* Apply the jEditable handlers to the table *!/
      $('Billables tbody td').editable( function( sValue ) {
        /!* Get the position of the current data from the node *!/
        var aPos = oTable.fnGetPosition( this );

        /!* Get the data array for this row *!/
        var aData = oTable.fnGetData( aPos[0] );

        /!* Update the data array and return the value *!/
        aData[ aPos[1] ] = sValue;
        return sValue;
      }, { "onblur": 'submit' } ); /!* Submit the form when bluring a field *!/

      /!* Init DataTables *!/
      oTable = $('Billables').dataTable();*/
    } );

}
