const shared = require("../shared");
const debug = require("debug")("customers.js");

Customers = new Meteor.Collection("customers");

Customers.name = "Customers";

Customers.schema = new SimpleSchema({
    _id: {
        label: "Code CMi",
        type: SimpleSchema.Integer,
        min: 1
    },
    codeSAP: {
        type: SimpleSchema.Integer,
        min: 1
    },
    name: {
        type: String
    },
    numAdd: {
        type: SimpleSchema.Integer,
        min: 1
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
    priceId: {
        type: String
    },
    ruleId: {
        type: String
    },
    baseFee: {
        type: Number,
        min: 0
    },
    fixedFee: {
        type: Number,
        min: 0
    },
    coefA: {
        type: SimpleSchema.Integer,
        min: 1
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
        "abbreviation", "name2", "name3", "natureId", "priceId", "ruleId", "baseFee", "fixedFee", "coefA", "creation",
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
                    else if (Template.currentData().value === "priceId")
                        return Prices.findOne({_id: what}).entitled;
                    else if (Template.currentData().value === "ruleId")
                        return Rules.findOne({_id: what}).entitled;
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

    Template.Customers$cell$priceId.helpers({
        helpers: {
            translateKey: function (priceId) {
                if(priceId)
                    return Prices.findOne({_id: priceId}).entitled;
                else return priceId;
            }
        },
    });

    Template.Customers$cell$ruleId.helpers({
        helpers: {
            translateKey: function (ruleId) {
                if(ruleId)
                    return Rules.findOne({_id: ruleId}).entitled;
                else return ruleId;
            }
        },
    });

    Template.Customers$Pagination.events({
        "click button.previous": function (event, templateInstance) {
            templateInstance.paginate().previous();
        },
        "click button.next": function (event, templateInstance) {
            templateInstance.paginate().next();
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
    Session.set('nature', 'undefined');

    Template.Customers$modalAdd.events({
        'click .modal-done': function (event, templ) {
            event.preventDefault();
            Customers.insert(
                {entitled: templ.$('#entitled').val(),
                    codeSAP:templ.$('#code_sap').val(),
                    name:templ.$('#name').val(),
                    numAdd:templ.$('#num_add').val(),
                    address:templ.$('#address').val(),
                    postalBox:templ.$('#postal_box').val(),
                    npa:templ.$('#npa').val(),
                    city:templ.$('#city').val(),
                    country:templ.$('#country').val(),
                    countryCode:templ.$('#country_code').val(),
                    _id:templ.$('#code_cmi').val(),
                    abbreviation:templ.$('#abbreviation').val(),
                    name2:templ.$('#name2').val(),
                    name3:templ.$('#name3').val(),
                    natureId:templ.$('#nature').val(),
                    priceId:templ.$('#price').val(),
                    ruleId:templ.$('#rule').val(),
                    baseFee:templ.$('#base_fee').val(),
                    fixedFee:templ.$('#fixed_fee').val(),
                    coefA:templ.$('#coef_a').val(),
                    creation:templ.$('#creation').val(),
                    changes:templ.$('#changes').val()
                });
            templ.find("form").reset();
        },
        "change #nature": function(evt) {
            let newNature = $(evt.target).val();
            if (newNature !== Session.get("nature"))
                Session.set('nature', newNature);
        }
    });

    Template.Customers$modalAdd.helpers({
        natures: function () {
            return CustomersCats.find({});
        },
        rules: function () {
            return Rules.find({});
        },
        prices: function () {
            if(Session.get("nature") === "undefined") {
                let one = CustomersCats.findOne({});
                if(one)
                    Session.set('nature', one._id);
            }
            if(Session.get("nature"))
                return Prices.find({natureId: Session.get("nature")});
            else
                return Prices.find({});
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

    Template.Customers$price.onRendered(function(){
        $('#price').material_select();
    });

    Template.Customers$rule.onRendered(function(){
        $('#rule').material_select();
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
                if (confirm("Supprimer \"" + this.name + "\" ?")) {
                    Customers.remove({_id: this._id});
                }
            }
        }
    });
}
