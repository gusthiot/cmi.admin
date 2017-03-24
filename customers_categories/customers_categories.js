
const shared = require("../shared");
const debug = require("debug")("customers_categories.js");

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
        CustomersCats.insert({entitled: "Interne", codeN:"I"});
        CustomersCats.insert({entitled: "Externe Académique", codeN:"A"});
        CustomersCats.insert({entitled: "Externe Industriel", codeN:"E"});
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
            templateInstance.paginate().previous();
        },
        "click button.next": function (event, templateInstance) {
            templateInstance.paginate().next();
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

    Template.CustomersCats$modalAdd.events({
        'click .modal-done': function (event, templ) {
            event.preventDefault();
            if(templ.$('#entitled').val() === "") {
                Materialize.toast("Intitulé vide !", 5000);
            }
            else if(templ.$('#code_n').val() === "" || /[^a-zA-Z0-9]/.test(templ.$('#code_n').val())) {
                Materialize.toast("Code N invalide !", 5000);
            }
            else {
                CustomersCats.insert(
                    {entitled: templ.$('#entitled').val(), codeN: templ.$('#code_n').val()}
                    );
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
