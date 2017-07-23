const shared = require("../shared");
const debug = require("debug")("customer_accounts.js");

CustomerAccs = new Meteor.Collection("customer_accounts");

CustomerAccs.name = "CustomerAccs";

CustomerAccs.schema = new SimpleSchema({
    _id: {
        type: SimpleSchema.Integer
    },
    number: {
        type: String
    },
    entitled: {
        type: String
    },
    customerId: {
        type: String
    },
    accountsCatId: {
        type: String
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    state: {
        type: String
    },
    creation: {
        type: String
    },
    changes: {
        type: String
    },
    closing : {
        type: String
    }
});

CustomerAccs.columns =
    ["number", "entitled", "customerId", "accountsCatId", "startTime", "endTime", "state", "creation", "changes",
        "closing"];

CustomerAccs.allow({
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
    Meteor.publish(CustomerAccs.name, function () {
        return CustomerAccs.find({});
    });
}

function makeTable() {
    return shared.makeTable(CustomerAccs, true, false);
}
let theTable = makeTable();

if (Meteor.isClient) {
    require("../lib/widget/client/widget");
    require("../lib/client/find-templates");

    Meteor.subscribe(CustomerAccs.name);

    Template.CustomerAccs$Edit.find = function (that) {
        if (that === undefined) {
            that = Template.instance();
        }
        if (that instanceof Blaze.TemplateInstance) {
            return Template.instance().findParent("Template." + CustomerAccs.name + "$Edit");
        }
    };

    let code = "undefined";

    Template.CustomerAccs$Edit.helpers({
        makeTable: theTable,
        selector: function() {
            if(code && code !== "undefined")
                return {customerId: code};
            else
                return {};
        }
    });

    Template.CustomerAccs$Edit.onCreated(function(){
        code = this.data;
    });

    Template.CustomerAccs$columnHead.events({
        'change select': function (event, template) {
            let val = $.fn.dataTable.util.escapeRegex(
                $(event.target).val()
            );
            template.dataTable.column
                .search(val ? '^' + val + '$' : '', true, false)
                .draw();
        }
    });

    Template.CustomerAccs$columnHead.helpers({
        helpers: {
            translateKey: function (what) {
                if(what) {
                    if (Template.currentData().value === "accountsCatId")
                        return AccountsCats.findOne({_id: what}).accountCode;
                    else return what;
                }
                else return what;
            }
        },
        translate: function (what) {
            return TAPi18n.__("CustomerAccs.column." + what);
        }
    });

    Template.CustomerAccs$cell$accountsCatId.helpers({
        helpers: {
            translateKey: function (accountsCatId) {
                if(accountsCatId)
                    return AccountsCats.findOne({_id: accountsCatId}).accountCode;
                else return accountsCatId;
            }
        },
    });

    Template.CustomerAccs$Pagination.events({
        "click button.previous": function (event, templateInstance) {
            templateInstance.paginate.previous();
        },
        "click button.nexts": function (event, templateInstance) {
            templateInstance.paginate.next();
        }
    });

    Template.CustomerAccs$Pagination.helpers({
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

    Template.CustomerAccs$addButton.onRendered(function () {
        this.$('.modal-trigger').assertSizeEquals(1).leanModal();
    });
    Session.set('account_cat', 'undefined');

    Template.CustomerAccs$modalAdd.events({
        'click .modal-done': function (event, templ) {
            event.preventDefault();
            let one = AccountsCats.findOne({_id: templ.$('#accounts_cat').val()});
            if(templ.$('#account_id').val() === "" || !shared.isPositiveInteger(templ.$('#account_id').val())) {
                Materialize.toast("Id compte invalide !", 5000);
            }
            else if(CustomerAccs.find({_id: templ.$('#account_id').val()}).count() > 0) {
                Materialize.toast("Ce Code CMi est déjà utilisé !", 5000);
            }
            else if(templ.$('#number').val() === "" || /[^a-zA-Z0-9]/.test(templ.$('#number').val())) {
                Materialize.toast("Numéro de compte invalide !", 5000);
            }
            else if(templ.$('#start_time').val() === "" || shared.isOlderThan(templ.$('#start_time').val(), one.startTime)) {
                console.log(one.startTime,templ.$('#start_time').val());
                Materialize.toast("Date de début invalide !", 5000);
            }
            else if(templ.$('#end_time').val() === ""|| shared.isOlderThan(one.endTime, templ.$('#end_time').val())) {
                console.log(templ.$('#end_time').val(),one.endTime);
                Materialize.toast("Date de fin invalide !", 5000);
            }
            else if(!shared.isOlderThan(templ.$('#start_time').val(), templ.$('#end_time').val())) {
                Materialize.toast("Date de fin doit être après date de début !", 5000);
            }
            else if(one.dateVar === "VAR" && shared.monthDiff(templ.$('#start_time').val(), templ.$('#end_time').val()) > one.monthsMax) {
                Materialize.toast("Période trop longue pour cette catégorie !", 5000);
            }
            else {
                CustomerAccs.insert(
                    {
                        _id: templ.$('#account_id').val(),
                        number: templ.$('#number').val(),
                        entitled: templ.$('#entitled').val(),
                        customerId: templ.$('#customer').val(),
                        accountsCatId: templ.$('#accounts_cat').val(),
                        startTime: templ.$('#start_time').val(),
                        endTime: templ.$('#end_time').val(),
                        state: $(templ.find('input:radio[name=state]:checked')).val(),
                        creation: templ.$('#creation').val(),
                        changes: templ.$('#changes').val(),
                        closing: templ.$('#closing').val()
                    });
                templ.find("form").reset();
            }
        },
        "change #accounts_cat": function(evt) {
            let newCat = $(evt.target).val();
            if (newCat !== Session.get("account_cat")) {
                Session.set('account_cat', newCat);
                checkDates();
            }
        }
    });

    Template.CustomerAccs$modalAdd.helpers({
        customers: function () {
            if (code && code !== "undefined")
                return Customers.find({_id: code});
            else
                return Customers.find({});
        },
        cats: function () {
            return AccountsCats.find({});
        },
        translate: function (what) {
            return TAPi18n.__("CustomerAccs.column." + what);
        },
        modalAdd: function () {
            return TAPi18n.__("CustomerAccs.modal.add");
        }
    });

    function checkDates() {
        let one = null;
        if (Session.get("account_cat") === "undefined") {
            one = AccountsCats.findOne({});
            if (one)
                Session.set('account_cat', one._id);
        }
        else
            one = AccountsCats.findOne({_id: Session.get("account_cat")});
        let dateVar = null;
        if (one) {
            dateVar = one.dateVar;
        }
        let start = $('#start_time');
        let end = $('#end_time');

        if (dateVar && dateVar === "FIX") {
            start.prop('disabled', true);
            start.pickadate().pickadate('picker').set('select', one.startTime);
            end.prop('disabled', true);
            end.pickadate().pickadate('picker').set('select', one.endTime);
        }
        else{
            start.prop('disabled', false);
            start.pickadate().pickadate('picker').set('clear');
            end.prop('disabled', false);
            end.pickadate().pickadate('picker').set('clear');
        }
    }

    Template.CustomerAccs$modalAdd.onRendered(function(){
        $('.datepicker').pickadate({
            selectMonths: true,
            selectYears: 40
        });
    });

    Template.CustomerAccs$customer.onRendered(function(){
        $('#customer').material_select();
    });

    Template.CustomerAccs$cat.onRendered(function(){
        $('#accounts_cat').material_select();
        checkDates();
    });


    Template.CustomerAccs$cell$remove.events({
        'click .cancelItem': function (event) {
            event.preventDefault();
            let count = Rights.find({accountId: this._id}).count();
            if (count > 0) {
                Materialize.toast("Suppression impossible, article utilisé " + count
                    + " fois dans la base de données ‘Droits‘", 5000);
            }
            else {
                shared.confirmRemove(this._id, this._id, CustomerAccs);
            }
        }
    });
}
