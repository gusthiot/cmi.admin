const shared = require("../shared");
const debug = require("debug")("rights.js");

Rights = new Meteor.Collection("rights");

Rights.name = "Rights";

Rights.schema = new SimpleSchema({
    consumerId: {
        type: String
    },
    accountId: {
        type: String
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    }
});

Rights.columns =
    ["consumerId", "accountId", "startTime", "endTime"];

Rights.allow({
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
    Meteor.publish(Rights.name, function () {
        return Rights.find({});
    });
}

function makeTable() {
    return shared.makeTable(Rights, false, false);
}
let theTable = makeTable();

if (Meteor.isClient) {
    require("../lib/widget/client/widget");
    require("../lib/client/find-templates");

    Meteor.subscribe(Rights.name);

    Template.Rights$Edit.find = function (that) {
        if (that === undefined) {
            that = Template.instance();
        }
        if (that instanceof Blaze.TemplateInstance) {
            return Template.instance().findParent("Template." + Rights.name + "$Edit");
        }
    };

    Template.Rights$Edit.helpers({makeTable: theTable});

    Template.Rights$columnHead.events({
        'change select': function (event, template) {
            let val = $.fn.dataTable.util.escapeRegex(
                $(event.target).val()
            );
            template.dataTable.column
                .search(val ? '^' + val + '$' : '', true, false)
                .draw();
        }
    });

    Template.Rights$columnHead.helpers({
        helpers: {
            translateKey: function (what) {
                if(what) {
                    // if (Template.currentData().value === "consumerId")
                    //     return User.collection.findOne({_id: what}).codeCMi;
                    // else
                    return what;
                }
                else return what;
            }
        },
        translate: function (what) {
            return TAPi18n.__("Rights.column." + what);
        }
    });

    Template.Rights$cell$consumerId.helpers({
        helpers: {
            translateKey: function (consumerId) {
                // if(consumerId)
                //     return Customers.findOne({_id: customerId}).codeCMi;
                // else
                    return consumerId;
            }
        },
    });

    Template.Rights$Pagination.events({
        "click button.previous": function (event, templateInstance) {
            templateInstance.paginate.previous();
        },
        "click button.nexts": function (event, templateInstance) {
            templateInstance.paginate.next();
        }
    });

    Template.Rights$Pagination.helpers({
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

    Template.Rights$addButton.onRendered(function () {
        this.$('.modal-trigger').assertSizeEquals(1).leanModal();
    });

    function isMulti(accountId) {
        let acc = CustomerAccs.findOne({_id: accountId});
        if(acc) {
            let catId = acc.accountsCatId;
            let cat = AccountsCats.findOne({_id: catId});
            if(cat) {
                let multi = cat.multi;
                return multi === "VRAI";
            }
        }
        console.log("id problem ?");
        return false;
    }

    Template.Rights$modalAdd.events({
        'click .modal-done': function (event, templ) {
            event.preventDefault();
            let acc = CustomerAccs.findOne({_id: templ.$('#account').val()});
            if(templ.$('#start_time').val() === "") {
                Materialize.toast("Date de début invalide !", 5000);
            }
            else if(templ.$('#end_time').val() === "") {
                Materialize.toast("Date de fin invalide !", 5000);
            }
            else if(!isMulti(templ.$('#account').val()) && Rights.find({accountId: templ.$('#account').val()}).count() > 0) {
                Materialize.toast("Ce Compte n'est pas multi-utilisateurs et est déjà utilisé !", 5000);
            }
            else if(!shared.isOlderThan(templ.$('#start_time').val(), templ.$('#end_time').val())) {
                Materialize.toast("Date de fin doit être après date de début !", 5000);
            }
            else if(!acc) {
                Materialize.toast("Account Id invalide !", 5000);
            }
            else if(!shared.isOlderThanOrEgal(acc.startTime, templ.$('#start_time').val())) {
                Materialize.toast("Date de début ne peut être avant début compte !", 5000);
            }
            else if(!shared.isOlderThanOrEgal(templ.$('#end_time').val(),acc.endTime)) {
                Materialize.toast("Date de fin ne peut être après fin compte !", 5000);
            }
            else {
                Rights.insert(
                    {
                        consumerId: templ.$('#consumer').val(),
                        accountId: templ.$('#account').val(),
                        startTime: templ.$('#start_time').val(),
                        endTime: templ.$('#end_time').val()
                    });
                templ.find("form").reset();
            }
        }
    });

    Template.Rights$modalAdd.helpers({
        consumers: function () {
            return User.collection.find({});
        },
        accounts: function () {
            return CustomerAccs.find({});
        },
        translate: function (what) {
            return TAPi18n.__("Rights.column." + what);
        },
        modalAdd: function () {
            return TAPi18n.__("Rights.modal.add");
        }
    });

    Template.Rights$modalAdd.onRendered(function(){
        $('.datepicker').pickadate({
            selectMonths: true,
            selectYears: 40
        });
    });

    Template.Rights$consumer.onRendered(function(){
        $('#consumer').material_select();
    });

    Template.Rights$account.onRendered(function(){
        $('#account').material_select();
    });

    Template.Rights$cell$remove.events({
        'click .cancelItem': function (event) {
            event.preventDefault();
            shared.confirmRemove(this.consumerId + " - " + this.accountId, this._id, Rights);
        }
    });
}
