const shared = require("../shared");
const debug = require("debug")("customer_accounts.js");

CustomerAccs = new Meteor.Collection("customer_accounts");

CustomerAccs.name = "CustomerAccs";

CustomerAccs.schema = new SimpleSchema({
    accountId: {
        type: SimpleSchema.Integer,
        min: 1
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

    Template.CustomerAccs$Edit.find = function (that) {
        if (that === undefined) {
            that = Template.instance();
        }
        if (that instanceof Blaze.TemplateInstance) {
            return Template.instance().findParent("Template." + CustomerAccs.name + "$Edit");
        }
    };

    Template.CustomerAccs$Edit.helpers({makeTable: theTable});

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
                    if (Template.currentData().value == "customerId")
                        return Customers.findOne({_id: what}).codeCMi;
                    else if (Template.currentData().value == "accountsCatId")
                        return AccountsCats.findOne({_id: what}).accountCode;
                    else return what;
                }
                else return what;
            }
        },
    });

    Template.CustomerAccs$cell$customerId.helpers({
        helpers: {
            translateKey: function (customerId) {
                if(customerId)
                    return Customers.findOne({_id: customerId}).codeCMi;
                else return customerId;
            }
        },
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
            templateInstance.paginate().previous();
        },
        "click button.next": function (event, templateInstance) {
            templateInstance.paginate().next();
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

    Template.CustomerAccs$modalAdd.events({
        'click .modal-done': function (event, templ) {
            event.preventDefault();
            CustomerAccs.insert(
                {accountId: templ.$('#account_id').val(),
                    number:templ.$('#number').val(),
                    entitled: templ.$('#entitled').val(),
                    customerId:templ.$('#customer').val(),
                    accountsCatId:templ.$('#accounts_cat').val(),
                    startTime: templ.$('#start_time').val(),
                    endTime: templ.$('#end_time').val(),
                    state:$(templ.find('input:radio[name=state]:checked')).val(),
                    creation: templ.$('#creation').val(),
                    changes: templ.$('#changes').val(),
                    closing: templ.$('#closing').val()
                });
        }
    });

    Template.CustomerAccs$modalAdd.helpers({
        customers: function () {
            return Customers.find({});
        },
        cats: function () {
            return AccountsCats.find({});
        }
    });

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
    });

    Template.CustomerAccs$cell$remove.events({
        'click .cancelItem': function (event) {
            event.preventDefault();
            if(confirm("remove \"" + this.entitled + "\" ?")) {
                console.log("remove " + this._id);
                CustomerAccs.remove({_id:this._id});
            }
        }
    });
}
