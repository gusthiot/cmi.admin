if (Meteor.isClient) {
    require("../lib/widget/client/widget");
    require("../lib/client/find-templates");
}

var debug = require("debug")("billables.js");

Billables = new Meteor.Collection("billables");

if (Meteor.isClient) {
    Meteor.subscribe('Billables');
}

var Schemas = {};

Schemas.Billable = new SimpleSchema({
    type: {
        type: String,
        allowedValues: ["USAGE_FEE", "RESERVATION_FEE", "ACCESS_FEE"]
    },
    operatedByUser: {
        type: String,
        optional: true
    },
    billableToAccount: {
        type: Number
    },
    billableToProject: {
        type: String,
        optional: true
    },
    startTime: {
        type: Date
    },
    billingDetails: {
        type: String,
        optional: true,
        max: 120
    },
    discount: {
        type: String,
        optional: true
    },
    validationState: {
        type: String,
        optional: true
    },
    updatedAt: {
        type: Date
    }
});

Billables.attachSchema(Schemas.Billable);

Billables.columns =
    ["type", "operatedByUser", "billableToAccount", "billableToProject",
        "startTime", "billingDetails", "discount", "validationState", "valSaveBtn"];


/* Build dataTable*/
function makeTable() {
    return new Tabular.Table({
        name: "Billables",
        collection: Billables,
        columns: _.map(Billables.columns, function (colSymbol) {
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
        initComplete: function () {  // Client only
            setupColumnFilterUI(Template.Billables$Edit.find().view, this);
        },
        sPaginationType: 'meteor_template',
        paginationTemplate: Meteor.isClient && Template.Billable$Pagination,
        paginationUpdated: function () {
            debug("Pagination updated");
        }
    });
}

if (Meteor.isClient) {
    Template.Billables$Edit.find = function (that) {
        if (that === undefined) {
            that = Template.instance();
        }
        if (that instanceof Blaze.TemplateInstance) {
            return Template.instance().findParent("Template.Billables$Edit");
        }
    }
}

function setupColumnFilterUI(parentView, dataTableElement) {
    var columns = dataTableElement.api().columns();
    // From https://datatables.net/examples/api/multi_filter_select.html
    columns.every(function () {

        var column = this,
            type = Billables.columns[column.index()];
        if (type === undefined) {
            return;  // Extra column on right for buttons
        }

        var context = {
            index: column.index(),
            type: type,
            values: function () {
                var values = _.uniq(_.pluck(_.sortBy(Billables.find({}).fetch(), type), type),
                  true);  // invoke _.uniq variant for sorted list
                values.push(undefined); //  permit an empty choice
                return values;
            }
        };

        $(column.header()).empty();

        var view = Template.Billable$columnHead.constructView();
        // Event handlers need access to the column object:
        view.templateInstance().dataTable = {
            column: column
        };

        Blaze.renderWithData(view, context, column.header(), undefined, parentView);
    });  // columns.every
} // setupColumnFilterUI

if (Meteor.isClient) {
    Template.Billable$columnHead.helpers({
        helpers: {
            translateKey: function (what) {
                var type = Template.currentData().value;
                if (type == "operatedByUser") {
                    return userTranslate(what);
                } else if (type == "type") {
                    return TAPi18n.__("Billables.type." + what);
                } else {
                    return what;
                }
            },
        },
    }),
    // When selects in column headers change, filter values accordingly
    Template.Billable$columnHead.events({
        'change select': function (event, template) {
            var val = $.fn.dataTable.util.escapeRegex(
                $(event.target).val()
            );
            template.dataTable.column
                .search(val ? '^' + val + '$' : '', true, false)
                .draw();
        }
    });
}

var theTable = makeTable();


if (Meteor.isClient) {
    function getRowDataByTr(trElement) {
        var dataTable = $(trElement).closest('table').DataTable();
        return dataTable.row(trElement).data();
    }

    function getTrByRowData(tableElement, rowData) {
        var dataTable = $(tableElement).DataTable();
        return dataTable.row(function (unused_idx, data) {
            return data._id === rowData._id;
        }).node();
    }

    /* Controller code for setting / changing the current line being edited */
    Template.Billables$Edit.viewmodel({
        editingRow: undefined,
        changeEditingRow: function (rowData_or_element_or_undefined) {
            var newEditingRow;
            if (rowData_or_element_or_undefined === undefined) {
                newEditingRow = undefined;
            } else if (rowData_or_element_or_undefined instanceof jQuery) {
                rowData_or_element_or_undefined.assertSizeEquals(1);
                newEditingRow = getRowDataByTr(rowData_or_element_or_undefined);
            } else {
                // Otherwise, assume this is the result of the .row() API in DataTables.
                newEditingRow = rowData_or_element_or_undefined;
            }
            this.editingRow(newEditingRow);
        },

        rowClicked: function (trElement) {
            var rowData = getRowDataByTr(trElement);
            if (!rowData) {
                return;
            }

            // No need to use the submit button; clicking elsewhere means to validate
            var previousRowData = this._previousRowData();
            if (previousRowData && _.isEqual(previousRowData._id, rowData._id)) {
                // Don't save if clicking within the same line
                event.stopPropagation();
                return;
            }
            this.saveEditingRow(trElement.closest('table'));
            this.changeEditingRow($(trElement));
        },

        _previousRowData: function () {
            var self = this;
            return Tracker.nonreactive(function () {
                return self.editingRow();
            });
        },
        _tableElement: function () {
            return this.templateInstance.$('table').assertSizeEquals(1)[0];
        },

        /**
         * Fetch the data of the current editable row, as updated by the user.
         * @returns {{type: (*|jQuery), operatedByUser, billableToAccount: (*|jQuery), billableToProject: (*|jQuery), billingDetails: (*|jQuery), discount: (*|jQuery), validationState: (*|jQuery)}}
         */
        editedItem: function () {
            var currentRowData = this._previousRowData();
            if (!currentRowData) {
                return;
            }

            var tableElement = this._tableElement(),
                tr = getTrByRowData(tableElement, currentRowData),
                formData = this.childrenByTag();

            var editedItem = {
                type: formData.type.value(),
                operatedByUser: formData.operatedByUser.value(),
                billableToAccount: formData.billableToAccount.value(),
                billableToProject: formData.billableToProject.value(),
                startTime: formData.startTime.value().toDate(),
                billingDetails: formData.billingDetails.value(),
                discount: formData.discount.value(),
                validationState: formData.validationState.value(),
            };
            return editedItem;
        },
        saveEditingRow: function () {
            var editItem = this.editedItem();
            if (!editItem) {
                return;
            }
            var previousRowData = this._previousRowData();
            if (_.isEqual(editItem, previousRowData)) {
                debug("No update needed");
                return;
            }
            Billables.update(previousRowData._id,
                {$set: _.extend(editItem, {updatedAt: new Date()})},
                function (error, result) {
                    if (error) {
                        return toast(Template.Billable$cell$toastEdited, error);
                    }
                    else {
                        result = toast(Template.Billable$cell$toastEdited);
                        return result;
                    }
                });
        },
    });

    Template.Billables$Edit.helpers({makeTable: theTable});

    /* To edit a table row, click on it
     * TODO: the viewmodel should handle that event and controller code */
    Template.Billables$Edit.events({
        'click tr': function (event, that) {
            Template.Billables$Edit.find(that).viewmodel.rowClicked(event.currentTarget);
        }
    });

    Template.Billables$Edit.helpers({
        editingRow: function () {
            var rowData = that.viewmodel.editingRow();
            return (rowData && rowData._id ? rowData._id : "nothing");
        },
    });

    var allCellTemplates = Billables.columns.map(function (x) {
        return Template["Billable$cell$" + x]
    });

    allCellTemplates.forEach(function (tmpl) {
        if (!tmpl) return;
        tmpl.helpers({
            isEditing: function () {
                var editingRow = Template.Billables$Edit.find().viewmodel.editingRow();
                return (editingRow && editingRow._id && (editingRow._id === Template.currentData()._id));
            }
        });
    });

// ===================== hide row with the cancel button ==============================
// ====================================================================================
    Template.Billable$cell$valSaveBtn$edit.events({
        'click .cancelItem': function (event, that) {
            Template.Billables$Edit.find(that).viewmodel.changeEditingRow(undefined);
            event.stopPropagation();
        }
    });

}

// ========================================================================================
// ========================================================================================

if (Meteor.isClient) {
    Template.Billables$addButton.onRendered(function () {
        this.$('.modal-trigger').assertSizeEquals(1).leanModal();
    });
}

function getBillableToAccount() {
    return Template.currentData().billableToAccount;
}

if (Meteor.isClient) {
    Template.Billable$cell$billableToAccount.helpers({
        toAccount: function () {
            return getBillableToAccount();
        }
    });

    Template.Billable$cell$billableToAccount$edit.helpers({
        valueToAccount: function () {
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

    remove: function () {
        return true;
    },

    update: function () {
        return true;
    }

});


// ======================================================================================================
// ==================================== Cell widgets ====================================================

if (Meteor.isClient) {
    Template.Billable$cell$type.helpers({
        values: function () {
            return Schemas.Billable.getDefinition("type").allowedValues;
        },
        translateKey: function () {
            return {
                translateKey: function (k) {
                    return TAPi18n.__("Billables.type." + k);
                },
            }
        }
    });

}

// ======================================================================================================
// ================================ Users select drop-down ==============================================
function userTranslate (k) {
    var userId = User.collection.findOne({_id: k});
    if (userId) {
        return TAPi18n.__(userId.fullName);
    } else {
        return k;
    }
}

if (Meteor.isClient) {
    Template.Billable$cell$operatedByUser.helpers({
        users: () => {
            var dbIdsFind = _.pluck(User.collection.find().fetch(), "_id");
            return dbIdsFind;
        },
        helpers: {
            translateKey: userTranslate
        }
    });
}

// ======================================================================================================
// ================================ Projects select drop-down ===========================================

if (Meteor.isClient) {
    Template.Billable$cell$billableToProject.helpers({
        projects: () => ["Project 1", "Project 2", "Project 3", "Project 4", "Project 5", "Project 6", "Project 7", "Project 8", "Project 9", "Project 10"],
    });
}

// ======================================================================================================
// ================================ Rabais select drop-down =============================================

if (Meteor.isClient) {
    Template.Billable$cell$discount.helpers({
        discounts: () => ["Rabais 1", "Rabais 2", "Rabais 3", "Rabais 4"],
    });
}

// ======================================================================================================
// ================================ validationStates select drop-down ===================================

if (Meteor.isClient) {
    Template.Billable$cell$validationState.helpers({
        validationStates: () => ["Validation 1", "Validation 2", "Validation 3", "Validation 4"],
    });
}

// ======================================================================================================
// ================================ Message toast done or error for all templates =======================

function toast(template, err) {
    var toastTemplateArgs;
    if (err) {
        toastTemplateArgs = {error: err};
    }
    var $toastContent = Blaze.toHTMLWithData(template, toastTemplateArgs);
    Materialize.toast($toastContent, 5000);
}

// ======================================================================================================
// =================================== Pagination: app-specific code ====================================

if (Meteor.isClient) {
    Template.Billable$Pagination.events({
        "click button.previous": function (event, templateInstance) {
            templateInstance.paginate.previous();
        },
        "click button.nexts": function (event, templateInstance) {
            templateInstance.paginate.next();
        }
    });
}
