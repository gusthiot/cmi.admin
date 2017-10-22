const shared = require("../lib/shared");
import { Customers } from '../customers/customers.js';
import { Rights } from '../rights/rights.js';
import { AccountsCats } from '../accounts_categories/accounts_categories.js';

export const CustomerAccs = new Meteor.Collection("customer_accounts");

CustomerAccs.name = "CustomerAccs";

CustomerAccs.schema = new SimpleSchema({
    accountId: {
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
    ["accountId", "number", "entitled", "customerId", "accountsCatId", "startTime", "endTime", "state", "creation", "changes",
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
    return shared.makeTable(CustomerAccs);
}
let theTable = makeTable();

if (Meteor.isClient) {
    require("../lib/widget/client/widget");
    require("../lib/client/find-templates");

    Meteor.subscribe(CustomerAccs.name);
    Meteor.subscribe(Customers.name);

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
    Session.set('editingRow', 'undefined');
    Session.set('accountCat', 'undefined');
    Session.set('saving', 'undefined');

    Template.CustomerAccs$Edit.onCreated(function(){
        code = this.data;
    });

    Template.CustomerAccs$Edit.events({
        'click tr': function (event) {
            if(Session.get('saving') === "undefined") {
                let dataTable = $(event.currentTarget).closest('table').DataTable();
                if(dataTable && dataTable !== "undefined") {
                    let row = dataTable.row(event.currentTarget).data();
                    if(row && row !== "undefined") {
                        if (Session.get('editingRow') === "undefined" || Session.get('editingRow')._id !== row._id) {
                            Session.set('editingRow', row);
                            Session.set('accountCat',row.accountsCatId);
                        }
                    }
                    else {
                        Session.set('editingRow', 'undefined');
                        Session.set('accountCat', 'undefined');
                    }
                }
                else {
                    Session.set('editingRow', 'undefined');
                    Session.set('accountCat', 'undefined');
                }
            }
            else {
                event.preventDefault();
                let values = shared.getChildrenValues($(event.currentTarget).children(), CustomerAccs.columns);
                if(checkValues(values)) {
                    let updatingValues = shared.updatingValues(values, Session.get('editingRow'));
                    if(Object.keys(updatingValues).length > 0) {
                        CustomerAccs.update(Session.get('editingRow')._id,
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

    let allCellTemplates = CustomerAccs.columns.map(function (x) {
        return Template["CustomerAccs$cell$" + x];
    });

    allCellTemplates.forEach(function (tmpl) {
        if (!tmpl) return;
        tmpl.helpers({
            isEditing: function () {
                if(Session.get('editingRow') !== 'undefined' && Session.get('editingRow')._id === Template.currentData()._id) {
                    if(tmpl.viewName === "Template.CustomerAccs$cell$startTime" || tmpl.viewName === "Template.CustomerAccs$cell$endTime") {
                        if(getVar('accountCat') === 'FIX')
                            return 0;
                    }
                    if(tmpl.viewName === "Template.CustomerAccs$cell$customerId")
                        return 0;
                    return 1;
                }
                return 0;
            }
        });
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
                    if (Template.currentData().value === "accountsCatId") {
                        let one = AccountsCats.findOne({_id: what});
                        if (one)
                            return one.accountCode;
                        else
                            console.log("no account category for : " + what);
                    }
                }
                return what;
            }
        },
        translate: function (what) {
            return TAPi18n.__("CustomerAccs.column." + what);
        }
    });

    Template.CustomerAccs$cell$accountsCatId.helpers({
        helpers: {
            translateKey: function (accountsCatId) {
                if(accountsCatId) {
                    let one = AccountsCats.findOne({_id: accountsCatId});
                    if(one)
                        return one.accountCode;
                    else
                        console.log("no account category for : " + accountsCatId);
                }
                return accountsCatId;
            }
        },
        cats: function () {
            let cats = AccountsCats.find({});
            if(!cats)
                return [];
            let results = [];
            cats.forEach(function(cat) {
                results.push(cat._id);
            });
            return results;
        }
    });

    Template.CustomerAccs$cell$accountsCatId.events({
        "change select": function(evt) {
            let newCat = $(evt.target).val();
            if (newCat !== Session.get('accountCat')) {
                Session.set('accountCat', newCat);
            }
        }
    });

    Template.CustomerAccs$cell$startTime.helpers({
        notfix: function () {
            if(Session.get('editingRow') !== 'undefined' && Session.get('editingRow')._id === Template.currentData()._id) {
                if(getVar('accountCat') === 'FIX')
                    return 0;
            }
            return 1;
        },
        startfix: function () {
            let one = getOne('accountCat');
            if(one)
                return one.startTime;
        }
    });

    Template.CustomerAccs$cell$endTime.helpers({
        notfix: function () {
            if(Session.get('editingRow') !== 'undefined' && Session.get('editingRow')._id === Template.currentData()._id) {
                if(getVar('accountCat') === 'FIX')
                    return 0;
            }
            return 1;
        },
        endfix: function () {
            let one = getOne('accountCat');
            if(one)
                return one.endTime;
        }
    });

    Template.CustomerAccs$cell$customerId.helpers({
        helpers: {
            translateKey: function (customerId) {
                if(customerId) {
                    let one = Customers.findOne({_id: customerId});
                    if(one)
                        return one.codeCMi;
                    else
                        console.log("no customer for : " + customerId);
                }
                return customerId;
            }
        },
        customers: function () {
            let custs = null;
            if (code && code !== "undefined")
                custs = Customers.find({_id: code});
            else
                custs = Customers.find({});
            if(!custs)
                return [];
            let results = [];
            custs.forEach(function(cust) {
                results.push(cust._id);
            });
            return results;
        }
    });

    Template.CustomerAccs$cell$save.helpers({
        selected: function () {
            if(Session.get('editingRow') !== 'undefined' && Session.get('editingRow')._id === Template.currentData()._id) {
                return 1;
            }
            return 0;
        }
    });

    Template.CustomerAccs$cell$save.events({
        'click .save': function (event) {
            event.preventDefault();
            Session.set('saving', 'yes');
        }
    });

    Template.CustomerAccs$cell$state.helpers({
        states: function () {
            return ["Actif", "Passif"];
        }
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

    function checkValues(values) {
        let one = AccountsCats.findOne({_id: values.accountsCatId});
        if (values.accountId === "" || !shared.isPositiveInteger(values.accountId)) {
            Materialize.toast("Id compte invalide !", 5000);
        }
        else if (CustomerAccs.find({_id: values.accountId}).count() > 0) {
            Materialize.toast("Ce Code CMi est déjà utilisé !", 5000);
        }
        else if (values.number === "" || /[^a-zA-Z0-9]/.test(values.number)) {
            Materialize.toast("Numéro de compte invalide !", 5000);
        }
        else if (!one) {
            Materialize.toast("Id catégorie de compte invalide !", 5000);
        }
        else if (values.startTime === "" || shared.isOlderThan(values.startTime, one.startTime)) {
            Materialize.toast("Date de début invalide !", 5000);
        }
        else if (values.endTime === "" || shared.isOlderThan(one.endTime, values.endTime)) {
            Materialize.toast("Date de fin invalide !", 5000);
        }
        else if (!shared.isOlderThan(values.startTime, values.endTime)) {
            Materialize.toast("Date de fin doit être après date de début !", 5000);
        }
        else if (one.dateVar === "VAR" && shared.monthDiff(values.startTime, values.endTime) > one.monthsMax) {
            Materialize.toast("Période trop longue pour cette catégorie !", 5000);
        }
        else return true;
        return false;
    }



    Template.CustomerAccs$modalAdd.events({
        'click .modal-done': function (event, templ) {
            event.preventDefault();
            let values = {
                accountId: templ.$('#account_id').val(),
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
            };
            if(checkValues(values)) {
                CustomerAccs.insert(values);
                Materialize.toast("Insertion effectuée", 5000);
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

    Template.CustomerAccs$modalAdd.onRendered(function(){
        $('.datepicker').datepicker({
            dateFormat: 'yy-mm-dd'
        });
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

    function getVar(sessionName) {
        let one = getOne(sessionName);
        let dateVar = null;
        if (one) {
            dateVar = one.dateVar;
        }
        return dateVar;
    }

    function getOne(sessionName) {
        let one = null;
        if (Session.get(sessionName) === "undefined") {
            one = AccountsCats.findOne({});
            if (one)
                Session.set(sessionName, one._id);
        }
        else
            one = AccountsCats.findOne({_id: Session.get(sessionName)});
        return one;
    }

    function checkDates() {
        let one = getOne('account_cat');
        let dateVar = null;
        if (one) {
            dateVar = one.dateVar;
        }
        let start = $('#start_time');
        let end = $('#end_time');

        if (dateVar && dateVar === "FIX") {
            start.prop('disabled', true);
            start.datepicker("setDate", new Date(one.startTime));
            end.prop('disabled', true);
            end.datepicker("setDate", new Date(one.endTime));
        }
        else{
            start.prop('disabled', false);
            start.datepicker("setDate", null);
            end.prop('disabled', false);
            end.datepicker("setDate", null);
        }
    }

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
                shared.confirmRemove(this.accountId, this._id, CustomerAccs);
            }
        }
    });
}
