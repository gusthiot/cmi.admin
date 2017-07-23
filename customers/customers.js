const shared = require("../shared");
const debug = require("debug")("customers.js");

Customers = new Meteor.Collection("customers");

Customers.name = "Customers";

Customers.schema = new SimpleSchema({
    _id: {
        type: SimpleSchema.Integer
    },
    codeSAP: {
        type: SimpleSchema.Integer
    },
    name: {
        type: String
    },
    numAdd: {
        type: SimpleSchema.Integer
    },
    address: {
        type: String
    },
    postalBox: {
        type: String
    },
    npa: {
        type: SimpleSchema.Integer,
        min: 1
    },
    city: {
        type: String
    },
    country: {
        type: String
    },
    countryCode: {
        type: String
    },
    abbreviation: {
        type: String
    },
    name2: {
        type: String
    },
    name3: {
        type: String
    },
    natureId: {
        type: String
    },
    creation: {
        type: String
    },
    changes: {
        type: String
    }
});


Customers.columns =
    ["codeSAP", "name", "numAdd", "address", "postalBox", "npa", "city", "country", "countryCode",
        "abbreviation", "name2", "name3", "natureId", "creation",
        "changes"];

Customers.allow({
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
    Meteor.publish(Customers.name, function () {
        return Customers.find({});
    });
}

function makeTable() {
    return shared.makeTable(Customers, true, true);
}
let theTable = makeTable();

if (Meteor.isClient) {
    require("../lib/widget/client/widget");
    require("../lib/client/find-templates");

    Meteor.subscribe(Customers.name);

    Template.Customers$Edit.find = function (that) {
        if (that === undefined) {
            that = Template.instance();
        }
        if (that instanceof Blaze.TemplateInstance) {
            return Template.instance().findParent("Template." + Customers.name + "$Edit");
        }
    };

    Template.Customers$Edit.helpers({makeTable: theTable});

    Template.Customers$columnHead.events({
        'change select': function (event, template) {
            let val = $.fn.dataTable.util.escapeRegex(
                $(event.target).val()
            );
            template.dataTable.column
                .search(val ? '^' + val + '$' : '', true, false)
                .draw();
        }
    });

    Template.Customers$columnHead.helpers({
        helpers: {
            translateKey: function (what) {
                if(what) {
                    if (Template.currentData().value === "natureId")
                        return CustomersCats.findOne({_id: what}).entitled;
                    else return what;
                }
                else return what;
            }
        },
        translate: function (what) {
            return TAPi18n.__("Customers.column." + what);
        }
    });

    Template.Customers$cell$natureId.helpers({
        helpers: {
            translateKey: function (natureId) {
                if(natureId)
                    return CustomersCats.findOne({_id: natureId}).entitled;
                else return natureId;
            }
        },
    });

    Template.Customers$Pagination.events({
        "click button.previous": function (event, templateInstance) {
            templateInstance.paginate.previous();
        },
        "click button.nexts": function (event, templateInstance) {
            templateInstance.paginate.next();
        }
    });

    Template.Customers$Pagination.helpers({
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

    Template.Customers$addButton.onRendered(function () {
        this.$('.modal-trigger').assertSizeEquals(1).leanModal();
    });

    Template.Customers$modalAdd.events({
        'click .modal-done': function (event, templ) {
            event.preventDefault();
            if(templ.$('#code_sap').val() === "" || !shared.isPositiveInteger(templ.$('#code_sap').val())) {
                Materialize.toast("Code SAP invalide !", 5000);
            }
            else if(templ.$('#code_cmi').val() === "" || /[^a-zA-Z0-9]/.test(templ.$('#code_cmi').val())) {
                Materialize.toast("Code CMi invalide !", 5000);
            }
            else if(Customers.find({_id: templ.$('#code_cmi').val()}).count() > 0) {
                Materialize.toast("Ce Code CMi est déjà utilisé !", 5000);
            }
            else if(templ.$('#abbreviation').val() === "" || /\s/.test(templ.$('#abbreviation').val())) {
                Materialize.toast("Abréviation invalide !", 5000);
            }
            else if(Customers.find({abbreviation: templ.$('#abbreviation').val()}).count() > 0) {
                Materialize.toast("Cet abréviation est déjà utilisée !", 5000);
            }
            else if(templ.$('#num_add').val() !== "" && !shared.isPositiveInteger(templ.$('#num_add').val())) {
                Materialize.toast("Numéro d'adresse invalide !", 5000);
            }
            else if(templ.$('#npa').val() !== "" && !shared.isPositiveInteger(templ.$('#npa').val())) {
                Materialize.toast("NPA invalide !", 5000);
            }
            else {
                Customers.insert(
                    {
                        entitled: templ.$('#entitled').val(),
                        codeSAP: templ.$('#code_sap').val(),
                        name: templ.$('#name').val(),
                        numAdd: templ.$('#num_add').val(),
                        address: templ.$('#address').val(),
                        postalBox: templ.$('#postal_box').val(),
                        npa: templ.$('#npa').val(),
                        city: templ.$('#city').val(),
                        country: templ.$('#country').val(),
                        countryCode: templ.$('#country_code').val(),
                        _id: templ.$('#code_cmi').val(),
                        abbreviation: templ.$('#abbreviation').val(),
                        name2: templ.$('#name2').val(),
                        name3: templ.$('#name3').val(),
                        natureId: templ.$('#nature').val(),
                        creation: templ.$('#creation').val(),
                        changes: templ.$('#changes').val()
                    });
                templ.find("form").reset();
            }
        }
    });

    Template.Customers$modalAdd.helpers({
        natures: function () {
            return CustomersCats.find({});
        },
        translate: function (what) {
            return TAPi18n.__("Customers.column." + what);
        },
        modalAdd: function () {
            return TAPi18n.__("Customers.modal.add");
        }
    });

    Template.Customers$nature.onRendered(function(){
        $('#nature').material_select();
    });

    Template.Customers$cell$accounts.events({
        'click .accounts': function (event) {
            event.preventDefault();
            Router.go('/customer_accounts/' + this._id);
        }
    });

    Template.Customers$cell$remove.events({
        'click .cancelItem': function (event) {
            event.preventDefault();
            let count = CustomerAccs.find({customerId: this._id}).count();
            if (count > 0) {
                Materialize.toast("Suppression impossible, article utilisé " + count
                    + " fois dans la base de données ‘Comptes‘", 5000);
            }
            else {
                shared.confirmRemove(this._id, this._id, Customers);
            }
        }
    });
}
