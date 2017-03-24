const shared = require("../shared");
const debug = require("debug")("accounts_categories.js");

AccountsCats = new Meteor.Collection("accounts_categories");

AccountsCats.name = "AccountsCats";

AccountsCats.schema = new SimpleSchema({
    entitled: {
        type: String
    },
    accountCode: {
        type: String
    },
    multi: {
        type: String
    }
});

AccountsCats.columns =
    ["entitled", "accountCode", "multi"];

AccountsCats.allow({
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
    // AccountsCats.remove({});
    if (AccountsCats.find({}).count() === 0) {
        AccountsCats.insert({entitled: "Compte standard", accountCode:"STD", multi:"VRAI"});
        AccountsCats.insert({entitled: "Compte projet de développement de procédés avec subsides", accountCode:"DEV", multi:"VRAI"});
        AccountsCats.insert({entitled: "Compte étudiant EPFL projet semestre Bachelor", accountCode:"BSP", multi:"FAUX"});
        AccountsCats.insert({entitled: "Compte étudiant EPFL projet semestre Master", accountCode:"MSP", multi:"FAUX"});
        AccountsCats.insert({entitled: "Compte étudiant EPFL projet de diplôme Master", accountCode:"MTP", multi:"FAUX"});
    }

    Meteor.publish(AccountsCats.name, function () {
        return AccountsCats.find({});
    });
}

function makeTable() {
    return shared.makeTable(AccountsCats, false);
}
let theTable = makeTable();

if (Meteor.isClient) {
    require("../lib/widget/client/widget");
    require("../lib/client/find-templates");

    Meteor.subscribe(AccountsCats.name);

    Template.AccountsCats$Edit.find = function (that) {
        if (that === undefined) {
            that = Template.instance();
        }
        if (that instanceof Blaze.TemplateInstance) {
            return Template.instance().findParent("Template." + AccountsCats.name + "$Edit");
        }
    };

    Template.AccountsCats$Edit.helpers({makeTable: theTable});

    Template.AccountsCats$columnHead.events({
        'change select': function (event, template) {
            let val = $.fn.dataTable.util.escapeRegex(
                $(event.target).val()
            );
            template.dataTable.column
                .search(val ? '^' + val + '$' : '', true, false)
                .draw();
        }
    });

    Template.AccountsCats$columnHead.helpers({
        translate: function (what) {
            return TAPi18n.__("AccountsCats.column." + what);
        }
    });

    Template.AccountsCats$Pagination.events({
        "click button.previous": function (event, templateInstance) {
            templateInstance.paginate().previous();
        },
        "click button.next": function (event, templateInstance) {
            templateInstance.paginate().next();
        }
    });

    Template.AccountsCats$Pagination.helpers({
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

    Template.AccountsCats$addButton.onRendered(function () {
        this.$('.modal-trigger').assertSizeEquals(1).leanModal();
    });

    Template.AccountsCats$modalAdd.events({
        'click .modal-done': function (event, templ) {
            event.preventDefault();
            if(templ.$('#entitled').val() === "") {
                Materialize.toast("Intitulé vide !", 5000);
            }
            else if(templ.$('#account_code').val() === "" || /[^a-zA-Z0-9]/.test(templ.$('#account_code').val())) {
                Materialize.toast("Code type compte invalide !", 5000);
            }
            else {
                AccountsCats.insert(
                    {
                        entitled: templ.$('#entitled').val(),
                        accountCode: templ.$('#account_code').val(),
                        multi: $(templ.find('input:radio[name=multi]:checked')).val()
                    });
                templ.find("form").reset();
            }
        }
    });

    Template.AccountsCats$modalAdd.helpers({
        translate: function (what) {
            return TAPi18n.__("AccountsCats.column." + what);
        },
        modalAdd: function () {
            return TAPi18n.__("AccountsCats.modal.add");
        }
    });

    Template.AccountsCats$cell$remove.events({
        'click .cancelItem': function (event) {
            event.preventDefault();
            let count = CustomerAccs.find({accountsCatId: this._id}).count();
            if (count > 0) {
                Materialize.toast("Suppression impossible, article utilisé " + count
                    + " fois dans la base de données ‘Comptes‘", 5000);
            }
            else {
                shared.confirmRemove(this.entitled, this._id, AccountsCats);
            }
        }
    });
}
