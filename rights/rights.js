const shared = require("../shared");

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
    return shared.makeTable(Rights, false);
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

    Session.set('editingRow', 'undefined');
    Session.set('saving', 'undefined');

    Template.Rights$Edit.events({
        'click tr': function (event, tmpl) {
            if(Session.get('saving') === "undefined") {
                let dataTable = $(event.currentTarget).closest('table').DataTable();
                if (dataTable && dataTable !== "undefined") {
                    let row = dataTable.row(event.currentTarget).data();
                    if (row && row !== "undefined") {
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
                let values = shared.getChildrenValues($(event.currentTarget).children(), Rights.columns);
                if(checkValues(values)) {
                    let updatingValues = shared.updatingValues(values, Session.get('editingRow'));
                    if(Object.keys(updatingValues).length > 0) {
                        Rights.update(Session.get('editingRow')._id,
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

    let allCellTemplates = Rights.columns.map(function (x) {
        return Template["Rights$cell$" + x]
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
                    if (Template.currentData().value === "consumerId")
                        return userId(what);
                    if (Template.currentData().value === "accountId")
                        return accountId(what);
                }
                return what;
            }
        },
        translate: function (what) {
            return TAPi18n.__("Rights.column." + what);
        }
    });

    Template.Rights$cell$consumerId.helpers({
        helpers: {
            translateKey: function (customerId) {
                return userId(customerId);
            }
        },
        consumers: function () {
            let users = Consumers.find({});
            if(!users)
                return [];
            let results = [];
            users.forEach(function(user) {
                results.push(user._id);
            });
            return results;
        }
    });

    Template.Rights$cell$save.helpers({
        selected: function () {
            if(Session.get('editingRow') !== 'undefined' && Session.get('editingRow')._id === Template.currentData()._id) {
                    return 1;
            }
            return 0;
        }
    });

    Template.Rights$cell$save.events({
        'click .save': function (event) {
            event.preventDefault();
            Session.set('saving', 'yes');
        }
    });

    function accountId(custAccId) {
        if(custAccId) {
            let one = CustomerAccs.findOne({_id: custAccId});
            if(one)
                return one.accountId;
            else
                console.log("no account for : " + custAccId);
        }
        return custAccId;
    }

    function userId(consumerId) {
        if(consumerId) {
            let one = Consumers.findOne({_id: consumerId});
            if(one)
                return one.userId;
            else
                console.log("no user for : " + consumerId);
        }
        return consumerId;
    }

    Template.Rights$cell$accountId.helpers({
        helpers: {
            translateKey: function (custAccId) {
                return accountId(custAccId);
            }
        },
        accounts: function () {
            let accs = CustomerAccs.find({});
            if(!accs)
                return [];
            let results = [];
            accs.forEach(function(acc) {
                results.push(acc._id);
            });
            return results;
        }
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

    function checkValues(values) {
        let acc = CustomerAccs.findOne({_id: values.accountId});
        if(values.startTime === "") {
            Materialize.toast("Date de début invalide !", 5000);
        }
        else if(values.endTime === "") {
            Materialize.toast("Date de fin invalide !", 5000);
            return false;
        }
        else if(!isMulti(values.accountId) && Rights.find({accountId: values.accountId}).count() > 0) {
            Materialize.toast("Ce Compte n'est pas multi-utilisateurs et est déjà utilisé !", 5000);
        }
        else if(!shared.isOlderThan(values.startTime, values.endTime)) {
            Materialize.toast("Date de fin doit être après date de début !", 5000);
        }
        else if(!acc) {
            Materialize.toast("Account Id invalide !", 5000);
        }
        else if(!shared.isOlderThanOrEgal(acc.startTime, values.startTime)) {
            Materialize.toast("Date de début ne peut être avant début compte !", 5000);
        }
        else if(!shared.isOlderThanOrEgal(values.endTime,acc.endTime)) {
            Materialize.toast("Date de fin ne peut être après fin compte !", 5000);
        }
        else return true;
        return false;
    }

    Template.Rights$modalAdd.events({
        'click .modal-done': function (event, templ) {
            event.preventDefault();
            let values = {
                startTime : templ.$('#start_time').val(),
                endTime: templ.$('#end_time').val(),
                accountId: templ.$('#account').val(),
                consumerId: templ.$('#consumer').val()
            };
            if(checkValues(values)) {
                Rights.insert(values);
                Materialize.toast("Insertion effectuée", 5000);
                templ.find("form").reset();
            }
        }
    });

    Template.Rights$modalAdd.helpers({
        consumers: function () {
            return Consumers.find({});
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
        $('.datepicker').datepicker({
            dateFormat: 'yy-mm-dd'
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
            shared.confirmRemove(userId(this.consumerId) + " - " + accountId(this.accountId), this._id, Rights);
        }
    });
}
