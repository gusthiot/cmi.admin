const shared = require("../shared");

CustomersCats = new Meteor.Collection("customers_categories");

CustomersCats.name = "CustomersCats";

CustomersCats.schema = new SimpleSchema({
    entitled: {
        type: String
    },
    codeN: {
        type: String
    }
});

CustomersCats.columns =
    ["entitled", "codeN"];

CustomersCats.allow({
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

if (Meteor.isServer) {
    // CustomersCats.remove({});
    if (CustomersCats.find({}).count() === 0) {
        CustomersCats.insert({entitled: "Interne", codeN: "I"});
        CustomersCats.insert({entitled: "Externe Académique", codeN: "A"});
        CustomersCats.insert({entitled: "Externe Industriel", codeN: "E"});
    }

    Meteor.publish(CustomersCats.name, function () {
        return CustomersCats.find({});
    });
}

function makeTable() {
    return shared.makeTable(CustomersCats, false);
}
let theTable = makeTable();


if (Meteor.isClient) {

    require("../lib/widget/client/widget");
    require("../lib/client/find-templates");

    Meteor.subscribe(CustomersCats.name);

    Template.CustomersCats$Edit.find = function (that) {
        if (that === undefined) {
            that = Template.instance();
        }
        if (that instanceof Blaze.TemplateInstance) {
            return Template.instance().findParent("Template." + CustomersCats.name + "$Edit");
        }
    };

    Template.CustomersCats$Edit.helpers({makeTable: theTable});

    Session.set('editingRow', 'undefined');
    Session.set('saving', 'undefined');

    Template.CustomersCats$Edit.events({
        'click tr': function (event) {
            if(Session.get('saving') === "undefined") {
                let dataTable = $(event.currentTarget).closest('table').DataTable();
                if(dataTable && dataTable !== "undefined") {
                    let row = dataTable.row(event.currentTarget).data();
                    if(row && row !== "undefined") {
                        if (Session.get('editingRow') === "undefined" || Session.get('editingRow')._id !== row._id)
                            Session.set('editingRow', row);
                    }
                    else
                        Session.set('editingRow', 'undefined');
                }
                else
                    Session.set('editingRow', 'undefined');
            }
            else {
                event.preventDefault();
                let values = shared.getChildrenValues($(event.currentTarget).children(), CustomersCats.columns);
                if(checkValues(values)) {
                    let updatingValues = shared.updatingValues(values, Session.get('editingRow'));
                    if(Object.keys(updatingValues).length > 0) {
                        CustomersCats.update(Session.get('editingRow')._id,
                            {$set: updatingValues},
                            function (error) {
                                if (error)
                                    Materialize.toast(error, 5000);
                                else
                                    Materialize.toast("Mise à jour effectuée", 5000);
                            });
                    }
                    else
                        Materialize.toast("Pas de changement", 5000);
                    Session.set('editingRow', 'undefined');
                }
                Session.set('saving', 'undefined');
            }
        }
    });

    let allCellTemplates = CustomersCats.columns.map(function (x) {
        return Template["CustomersCats$cell$" + x]
    });

    allCellTemplates.forEach(function (tmpl) {
        if (!tmpl) return;
        tmpl.helpers({
            isEditing: function () {
                if(Session.get('editingRow') !== 'undefined' && Session.get('editingRow')._id === Template.currentData()._id)
                    return 1;
                else
                    return 0;
            }
        });
    });

    Template.CustomersCats$columnHead.events({
        'change select': function (event, template) {
            let val = $.fn.dataTable.util.escapeRegex(
                $(event.target).val()
            );
            template.dataTable.column
                .search(val ? '^' + val + '$' : '', true, false)
                .draw();
        }
    });

    Template.CustomersCats$columnHead.helpers({
       translate: function (what) {
           return TAPi18n.__("CustomersCats.column." + what);
       }
    });

    Template.CustomersCats$Pagination.events({
        "click button.previous": function (event, templateInstance) {
            templateInstance.paginate.previous();
        },
        "click button.nexts": function (event, templateInstance) {
            templateInstance.paginate.next();
        }
    });

    Template.CustomersCats$Pagination.helpers({
        notnull: function (pages) {
            return pages > 0;
        },
        notfirst: function (page) {
            return page > 1;
        },
        notlast: function (page, pages) {
            return page < pages;
        }
    });

    Template.CustomersCats$addButton.onRendered(function () {

        this.$('.modal-trigger').assertSizeEquals(1).leanModal();
    });

    function checkValues(values) {
        if(values.entitled === "") {
            Materialize.toast("Intitulé vide !", 5000);
        }
        else if(values.codeN === "" || /[^a-zA-Z0-9]/.test(values.codeN)) {
            Materialize.toast("Code N invalide !", 5000);
        }
        else return true;
        return false;
    }

    Template.CustomersCats$modalAdd.events({
        'click .modal-done': function (event, templ) {
            event.preventDefault();
            let values = {
                entitled: templ.$('#entitled').val(),
                codeN: templ.$('#code_n').val()
            };
            if(checkValues(values)) {
                CustomersCats.insert(values);
                Materialize.toast("Insertion effectuée", 5000);
                templ.find("form").reset();
            }
        }
    });

    Template.CustomersCats$modalAdd.helpers({
        translate: function (what) {
            return TAPi18n.__("CustomersCats.column." + what);
        },
        modalAdd: function () {
            return TAPi18n.__("CustomersCats.modal.add");
        }
    });

    Template.CustomersCats$cell$save.helpers({
        selected: function () {
            if(Session.get('editingRow') !== 'undefined' && Session.get('editingRow')._id === Template.currentData()._id) {
                return 1;
            }
            return 0;
        }
    });

    Template.CustomersCats$cell$save.events({
        'click .save': function (event) {
            event.preventDefault();
            Session.set('saving', 'yes');
        }
    });

    Template.CustomersCats$cell$remove.events({
        'click .cancelItem': function (event) {
            event.preventDefault();
            let count = Customers.find({natureId: this._id}).count();
            if (count > 0) {
                Materialize.toast("Suppression impossible, article utilisé " + count
                    + " fois dans la base de données ‘Clients‘", 5000);
            }
            else {
                let count = Prices.find({natureId: this._id}).count();
                if (count > 0) {
                    Materialize.toast("Suppression impossible, article utilisé " + count
                        + " fois dans la base de données ‘Tarifs‘", 5000);
                }
                else {
                    shared.confirmRemove(this.entitled, this._id, CustomersCats);
                }
            }
        }
    });
}
