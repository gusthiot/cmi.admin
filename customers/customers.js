const shared = require("../lib/shared");

const Customers = new Meteor.Collection("customers");

Customers.name = "Customers";

Customers.schema = new SimpleSchema({
    codeCMi: {
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
    ["codeCMi", "codeSAP", "name", "numAdd", "address", "postalBox", "npa", "city", "country", "countryCode",
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
    return shared.makeTable(Customers, true);
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

    Session.set('editingRow', 'undefined');
    Session.set('saving', 'undefined');

    Template.Customers$Edit.events({
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
                let values = shared.getChildrenValues($(event.currentTarget).children(), Customers.columns);
                if(checkValues(values, 'update')) {
                    let updatingValues = shared.updatingValues(values, Session.get('editingRow'));
                    if(Object.keys(updatingValues).length > 0) {
                        Customers.update(Session.get('editingRow')._id,
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

    let allCellTemplates = Customers.columns.map(function (x) {
        return Template["Customers$cell$" + x]
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
                    if (Template.currentData().value === "natureId") {
                        let one = CustomersCats.findOne({_id: what});
                        if(one)
                            return one.entitled;
                        else
                            console.log("no customers category for : " + what);
                    }
                }
                return what;
            }
        },
        translate: function (what) {
            return TAPi18n.__("Customers.column." + what);
        }
    });

    Template.Customers$cell$save.helpers({
        selected: function () {
            if(Session.get('editingRow') !== 'undefined' && Session.get('editingRow')._id === Template.currentData()._id) {
                return 1;
            }
            return 0;
        }
    });

    Template.Customers$cell$save.events({
        'click .save': function (event) {
            event.preventDefault();
            Session.set('saving', 'yes');
        }
    });

    Template.Customers$cell$natureId.helpers({
        helpers: {
            translateKey: function (natureId) {
                if(natureId) {
                    let one = CustomersCats.findOne({_id: natureId});
                    if(one)
                        return one.entitled;
                    else
                        console.log("no customers category for : " + natureId);

                }
                return natureId;
            }
        },
        natures: function () {
            let cats = CustomersCats.find({});
            if(!cats)
                return [];
            let results = [];
            cats.forEach(function(cat) {
                results.push(cat._id);
            });
            return results;
        }
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

    function checkValues(values, mode) {
        if(values.codeSAP === "" || !shared.isPositiveInteger(values.codeSAP)) {
            Materialize.toast("Code SAP invalide !", 5000);
        }
        else if(values.codeCMi === "" || /[^a-zA-Z0-9]/.test(values.codeCMi)) {
            Materialize.toast("Code CMi invalide !", 5000);
        }
        else if((mode === "insert" || (mode === "update") && values.codeCMi !== Session.get('editingRow').codeCMi) &&
            (Customers.find({codeCMi: values.codeCMi}).count() > 0)) {
                Materialize.toast("Ce Code CMi est déjà utilisé !", 5000);
        }
        else if(values.abbreviation === "" || /\s/.test(values.abbreviation)) {
            Materialize.toast("Abréviation invalide !", 5000);
        }
        else if((mode === "insert" || (mode === "update") && values.abbreviation !== Session.get('editingRow').abbreviation)
            && (Customers.find({abbreviation: values.abbreviation}).count() > 0)) {
                Materialize.toast("Cet abréviation est déjà utilisée !", 5000);
        }
        else if(values.numAdd !== "" && !shared.isPositiveInteger(values.numAdd)) {
            Materialize.toast("Numéro d'adresse invalide !", 5000);
        }
        else if(values.npa !== "" && !shared.isPositiveInteger(values.npa)) {
            Materialize.toast("NPA invalide !", 5000);
        }
        else return true;
        return false;
    }

    Template.Customers$modalAdd.events({
        'click .modal-done': function (event, templ) {
            event.preventDefault();
            let values = {
                codeCMi: templ.$('#code_cmi').val(),
                codeSAP: templ.$('#code_sap').val(),
                name: templ.$('#name').val(),
                numAdd: templ.$('#num_add').val(),
                address: templ.$('#address').val(),
                postalBox: templ.$('#postal_box').val(),
                npa: templ.$('#npa').val(),
                city: templ.$('#city').val(),
                country: templ.$('#country').val(),
                countryCode: templ.$('#country_code').val(),
                abbreviation: templ.$('#abbreviation').val(),
                name2: templ.$('#name2').val(),
                name3: templ.$('#name3').val(),
                natureId: templ.$('#nature').val(),
                creation: templ.$('#creation').val(),
                changes: templ.$('#changes').val()
            };
            if(checkValues(values, 'insert')) {
                Customers.insert(values);
                Materialize.toast("Insertion effectuée", 5000);
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
            Router.go('/customer_accounts/' + this.codeCMi);
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
