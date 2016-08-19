Billables = new Meteor.Collection("billables");

if (Meteor.isClient){
  Meteor.subscribe('Billables');
}

var Schemas = {};

Schemas.Billable = new SimpleSchema({
  type: {
    type: String,
    allowedValues: ["USAGE_FEE", "RESERVATION_FEE", "ACCESS_FEE"]
  },
  operatedByUser: {
    type: String
  },
  billableToAccount: {
    type: Number
  },
  billableToProject: {
    type: String
  },
  startTime: {
    type: Date
  },
  billingDetails: {
    type: String,
    max: 120
  },
  discount: {
    type: String
  },
  validationState: {
    type: String
  },
  updatedAt: {
    type: Date
  }
});

Billables.attachSchema(Schemas.Billable);

Billables.editingRow = new ReactiveVar();

Billables.columns =
  ["type", "operatedByUser", "billableToAccount", "billableToProject",
   "startTime", "billingDetails", "discount", "validationState", "valSaveBtn"];

/* Build dataTable*/
function makeTable() {
  return new Tabular.Table({
    name: "Billables",
    collection: Billables,
    columns: _.map(Billables.columns, function(colSymbol) {
      return {
        data: colSymbol,
        title: TAPi18n.__("Billables.column." + colSymbol),
        defaultContent: "-",
        tmpl: Meteor.isClient && Template["Billable$cell$" + colSymbol],
      };
    }),
    language: Tabular.Translations.getCurrent(),
    //http://datatables.net/extensions/select/examples/initialisation/cells.html
    select: {
      style: "os",
      items: "cell",
    },
    initComplete: function() {
      setupColumnFilterUI(this);
    },
    sPaginationType: 'meteor_template',
    paginationTemplate: Meteor.isClient && Template.Billable$Pagination,
    paginationUpdated: function() {
      console.log("Pagination updated");
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
      sortedValues:[
        {value: "usage_fee", translate: translate},
        {value: "reservation_fee", translate: translate},
        {value: "access_fee", translate: translate}
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


function updateServerAndToast(tr, currentRowData) {
    var editItem = {
        type: $( ".typeEdit option:selected", tr ).val(),
        operatedByUser: $( ".userEdit option:selected", tr ).text(),
        billableToAccount: $( "#account", tr ).val(),
        billableToProject: $( ".projectEdit option:selected", tr ).text(),
        billingDetails: $( "#icon_prefix2", tr ).val(),
        discount: $( ".discountEdit option:selected", tr ).text(),
        validationState: $( ".stateEdit option:selected", tr ).text(),
    };

    var dateTimePickerData = $( ".startTime-edit", tr ).data( 'DateTimePicker' );
    if (dateTimePickerData) {
        editItem.startTime = dateTimePickerData.date().toDate();
    }

    // TODO: if editItem is deeply equal to currentRowData, do nothing.

    Billables.update( currentRowData._id,
        {$set: _.extend(editItem, { updatedAt: new Date() })},
        function (error, result) {
        if (error) {
            return toast( Template.Billable$cell$toastEdited, error );
        }
        else {
            result = toast( Template.Billable$cell$toastEdited );
            return result;
        }
    } );
}

if (Meteor.isClient) {
  function getRowDataByTr(trElement) {
    var dataTable = $(trElement).closest( 'table' ).DataTable();
    return dataTable.row(trElement).data();
  }

  function getTrByRowData(tableElement, rowData) {
    var dataTable = $(tableElement).DataTable();
    return dataTable.row(function (unused_idx, data) {
      return data._id === rowData._id;
    }).node();
  }

  Template.Billables$Edit.helpers({makeTable: theTable});

  /* To edit a table row, click on it */
  Template.Billables$Edit.events({
    'click tr': function (event) {
      var rowData = getRowDataByTr(event.currentTarget);
      if (rowData) {
        changeEditingRow($(event.currentTarget).closest( 'table' ), rowData);
      }
    }
  });

  Template.Billables$Edit.helpers({
    editingRow: function () {
      var rowData = Billables.editingRow.get();
      return (rowData && rowData._id ? rowData._id: "nothing");
    },
  });

  function changeEditingRow(tableElement, rowData) {
      var previousRowData;
      Tracker.nonreactive( function () {
          previousRowData = Billables.editingRow.get( rowData );
      } );
      if (previousRowData && !_.isEqual( previousRowData._id, rowData._id )) {
          updateServerAndToast( getTrByRowData( tableElement, previousRowData ), previousRowData );
      }
      Billables.editingRow.set( rowData );
  }

    var allCellTemplates = Billables.columns.map( function (x) {
        return Template["Billable$cell$" + x]
    } );

    allCellTemplates.forEach( function (tmpl) {
        if (!tmpl) return;
        tmpl.helpers( {
            isEditing: function () {
                var editingRow = Billables.editingRow.get();
                return (editingRow && editingRow._id && (editingRow._id === Template.currentData()._id));
            }
        } );
    } );

    Template.Billable$cell$valSaveBtn$edit.events({
        'click .cancelItem': function(){
            //Session.set('editItemId', null);
            console.log("cancelled");
            var tr = $(event.currentTarget).closest( 'tr' );
            var row = table.row(tr);

            if ( row.child.isShown() ) {
                // This row is already open - close it
                row.child.hide();
                tr.removeClass('shown');
            }
            else {
                // Open this row
                row.child( format(row.data()) ).show();
                tr.addClass('shown');
            }
            return false;
        }
    });

}


/* Date picker */

/**
 * Return the date format to use.
 *
 * Must be the same format that the DateTimePicker expects at parse time.
 */
function getDateFormat() {
  // TODO: specific to US locale.
  return 'MM/DD/YYYY hh:mm a';
}

if (Meteor.isClient) {
  Template.Billable$cell$startTime.helpers({
    formattedDate: function () {
      return (moment(Template.currentData().startTime ).format(getDateFormat()));
    }
  });

  Template.Billable$cell$startTime$edit.helpers({
    asDatePickerTime: function(time) {
      return moment(time).format(getDateFormat());
    }
  });

  Template.Billable$cell$startTime$edit.onRendered(function() {
      this.$('.startTime-edit').assertSizeEquals(1).datetimepicker();
  });
}

if (Meteor.isClient){
  Template.Billable$cell$billingDetails$edit.onRendered(function() {
    this.$('textarea#icon_prefix2').characterCounter();
  });
}

if (Meteor.isClient){
  Template.Billables$addButton.onRendered(function(){
    this.$('.modal-trigger').assertSizeEquals(1).leanModal();
  });
}

function getBillableToAccount() {
  return Template.currentData().billableToAccount;
}

if (Meteor.isClient) {
  Template.Billable$cell$billableToAccount.helpers({
    toAccount: function() {
      return getBillableToAccount();
    }
  });

  Template.Billable$cell$billableToAccount$edit.helpers({
    valueToAccount: function() {
      return getBillableToAccount();
    }
  });
}


if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('Billables', function () {
    return Billables.find({});
  });
}

Billables.allow({
  insert: function () {
    return true;
  },

  remove: function (){
    return true;
  },

  update: function() {
    return true;
  }

});

// ======================================================================================================
// ======================================================================================================
// Cell widgets
// TODO: a lot of code for the cell widgets is to be moved here.

if (Meteor.isClient) {
    SelectWidget("Billable$cell$type", Billables.simpleSchema());
}

// ======================================================================================================
// ======================================================================================================

// Message toast done or error for all templates
function toast(template, err) {
  var toastTemplateArgs;
  if (err) {
    toastTemplateArgs = {error: err};
  }
  var $toastContent = Blaze.toHTMLWithData( template, toastTemplateArgs );
  Materialize.toast( $toastContent, 5000 );
}

// ======================================================================================================
// ======================================================================================================

// Pagination: app-specific code

if (Meteor.isClient) {
  Template.Billable$Pagination.events({
    "click button.previous": function (event, templateInstance) {
      templateInstance.paginate.previous();
    },
    "click button.next": function (event, templateInstance) {
      templateInstance.paginate.next();
    }
  });
}

// ======================================================================================================
// ======================================================================================================

/**
 * Select widget for translatable, single-choice string values.
 *
 * @param templateName
 * @param allowedKeysOrSchema
 */
function SelectWidget(templateName, allowedKeysOrSchema) {
    var fieldName = templateName.substr(templateName.lastIndexOf('$') + 1); // e.g. "type"

    var topLevelTranslationKey = "Billables";
    function translate(k) {
        return TAPi18n.__(topLevelTranslationKey + "." + fieldName + "." + k);
    }

    var allowedKeys;
    if (allowedKeysOrSchema instanceof SimpleSchema) {
        allowedKeys = allowedKeysOrSchema.getDefinition(fieldName).allowedValues;
    } else if ("length" in allowedKeys) {
        allowedKeys = allowedKeysOrSchema;
    } else {
        throw new Meteor.Error("allowedKeys must be a SimpleSchema or an array");
    }

    Template[templateName].helpers({
        translate: translate,
        SelectWidget$options: function () {
            return {
                uniqueClass: fieldName + "Edit",
                maybeSelected: function(currentValue, value) {
                    return (currentValue === value) ? {selected: '1'}: {};
                },
                values: _.map(allowedKeys, function (k) {
                    return {
                        translate: translate,
                        value: k
                    };
                })
            }
        },
    });

}
