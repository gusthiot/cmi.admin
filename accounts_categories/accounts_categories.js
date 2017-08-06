const shared = require("../shared");

AccountsCats = new Meteor.Collection("accounts_categories");

AccountsCats.name = "AccountsCats";

AccountsCats.schema = new SimpleSchema({
    entitled: {
        type: String
    },
    accountCode: {
        type: String
    },
    dateVar: {
        type: String
    },
    monthsMax: {
        type: SimpleSchema.Integer
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    multi: {
        type: String
    }
});

AccountsCats.columns =
    ["entitled", "accountCode", "dateVar", "monthsMax", "startTime", "endTime", "multi"];

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
    //AccountsCats.remove({});
    if (AccountsCats.find({}).count() === 0) {
        AccountsCats.insert({entitled: "Standard", accountCode:"STD", dateVar: "VAR", monthsMax: 60, startTime: "2016-01-01", endTime: "2099-12-31", multi:"VRAI"});
        AccountsCats.insert({entitled: "Projet de Développement sur 3 mois", accountCode:"DEVT16.17", dateVar: "VAR", monthsMax: 3, startTime: "2016-09-01", endTime: "2017-08-31", multi:"VRAI"});
        AccountsCats.insert({entitled: "Projet de Développement sur 6 mois", accountCode:"DEVS16.17", dateVar: "VAR", monthsMax: 6, startTime: "2016-09-01", endTime: "2017-08-31", multi:"VRAI"});
        AccountsCats.insert({entitled: "Projet de Développement sur 12 mois", accountCode:"DEVA16.17", dateVar: "VAR", monthsMax: 12, startTime: "2016-09-01", endTime: "2017-08-31", multi:"VRAI"});
        AccountsCats.insert({entitled: "Projet de Semestre Automne Bachelor", accountCode:"BSA16.17", dateVar: "FIX", startTime: "2016-09-20", endTime: "2017-01-27", multi:"FAUX"});
        AccountsCats.insert({entitled: "Projet de Semestre Printemps Bachelor", accountCode:"BSP16.17", dateVar: "FIX", startTime: "2017-02-20", endTime: "2017-06-23", multi:"FAUX"});
        AccountsCats.insert({entitled: "Projet de Semestre Automne Master", accountCode:"MSA16.17", dateVar: "FIX", startTime: "2016-09-20", endTime: "2017-01-27", multi:"FAUX"});
        AccountsCats.insert({entitled: "Projet de Semestre Printemps Master", accountCode:"MSP16.17", dateVar: "FIX", startTime: "2017-02-20", endTime: "2017-06-23", multi:"FAUX"});
        AccountsCats.insert({entitled: "Projet de Master", accountCode:"PDM16.17", dateVar: "VAR", monthsMax: 6, startTime: "2016-09-01", endTime: "2017-08-31", multi:"FAUX"});
        AccountsCats.insert({entitled: "Projet de Master (finit après 31/08)", accountCode:"PDM16.17+", dateVar: "VAR", monthsMax: 60, startTime: "2016-04-01", endTime: "2018-01-31", multi:"FAUX"});
        AccountsCats.insert({entitled: "Projet en Echange", accountCode:"ECH16.17", dateVar: "VAR", monthsMax: 6, startTime: "2016-09-01", endTime: "2017-08-31", multi:"FAUX"});
        AccountsCats.insert({entitled: "Projet en Echange (finit après 31/08)", accountCode:"ECH16.17+", dateVar: "VAR", monthsMax: 6, startTime: "2016-09-01", endTime: "2018-01-31", multi:"FAUX"});
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

    Session.set('editingRow', 'undefined');
    Session.set('dateVar', 'undefined');
    Session.set('saving', 'undefined');

    Template.AccountsCats$Edit.events({
        'click tr': function (event) {
            if(Session.get('saving') === "undefined") {
                let dataTable = $(event.currentTarget).closest('table').DataTable();
                if(dataTable && dataTable !== "undefined") {
                    let row = dataTable.row(event.currentTarget).data();
                    if(row && row !== "undefined") {
                        if (Session.get('editingRow') === "undefined" || Session.get('editingRow')._id !== row._id) {
                            Session.set('editingRow', row);
                            Session.set('dateVar',row.dateVar);
                        }
                    }
                    else {
                        Session.set('editingRow', 'undefined');
                        Session.set('dateVar', 'undefined');
                    }
                }
                else {
                    Session.set('editingRow', 'undefined');
                    Session.set('dateVar', 'undefined');
                }
            }
            else {
                event.preventDefault();
                let values = shared.getChildrenValues($(event.currentTarget).children(), AccountsCats.columns);
                if(checkValues(values)) {
                    let updatingValues = shared.updatingValues(values, Session.get('editingRow'));
                    if(Object.keys(updatingValues).length > 0) {
                        AccountsCats.update(Session.get('editingRow')._id,
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

    let allCellTemplates = AccountsCats.columns.map(function (x) {
        return Template["AccountsCats$cell$" + x]
    });

    allCellTemplates.forEach(function (tmpl) {
        if (!tmpl) return;
        tmpl.helpers({
            isEditing: function () {
                if(Session.get('editingRow') !== 'undefined' && Session.get('editingRow')._id === Template.currentData()._id) {
                    if(tmpl.viewName === "Template.AccountsCats$cell$monthsMax") {
                        let dv = Template.currentData().dateVar;
                        if(Session.get('dateVar') !== "undefined")
                            dv = Session.get('dateVar');
                        if(dv === 'FIX')
                            return 0;
                    }
                    return 1;
                }
                else
                    return 0;
            }
        });
    });

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

    Template.AccountsCats$cell$dateVar.helpers({
        vars: function () {
            return ["VAR", "FIX"];
        }
    });

    Template.AccountsCats$cell$save.helpers({
        selected: function () {
            if(Session.get('editingRow') !== 'undefined' && Session.get('editingRow')._id === Template.currentData()._id) {
                return 1;
            }
            return 0;
        }
    });

    Template.AccountsCats$cell$save.events({
        'click .save': function (event) {
            event.preventDefault();
            Session.set('saving', 'yes');
        }
    });

    Template.AccountsCats$cell$monthsMax.helpers({
        notfix: function () {
            if(Session.get('editingRow') !== 'undefined' && Session.get('editingRow')._id === Template.currentData()._id) {
                if (Session.get('dateVar') === "FIX")
                    return 0;
            }
            return 1;
        }
    });

    Template.AccountsCats$cell$dateVar.events({
        "change select": function(evt) {
            let newVar = $(evt.target).val();
            if (newVar !== Session.get('dateVar')) {
                Session.set('dateVar', newVar);
            }
        }
    });

    Template.AccountsCats$cell$multi.helpers({
        multis: function () {
            return ["VRAI", "FAUX"];
        }
    });

    Template.AccountsCats$Pagination.events({
        "click button.previous": function (event, templateInstance) {
            templateInstance.paginate.previous();
        },
        "click button.nexts": function (event, templateInstance) {
            templateInstance.paginate.next();
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

    function checkValues(values) {
        if(values.entitled === "") {
            Materialize.toast("Intitulé vide !", 5000);
        }
        else if(values.accountCode === "" || /[^a-zA-Z0-9.]/.test(values.accountCode)) {
            Materialize.toast("Code type compte invalide !", 5000);
        }
        else if(values.dateVar === "VAR" && values.monthsMax === "") {
            Materialize.toast("Période variable doit avoir un max !", 5000);
        }
        else if(values.monthsMax === !shared.isPositiveInteger(values.monthsMax)) {
            Materialize.toast("Nombre de mois invalide !", 5000);
        }
        else return true;
        return false;
    }

    Template.AccountsCats$modalAdd.events({
        'click .modal-done': function (event, templ) {
            event.preventDefault();
            let values = {
                entitled: templ.$('#entitled').val(),
                accountCode: templ.$('#account_code').val(),
                dateVar: $(templ.find('input:radio[name=date_var]:checked')).val(),
                monthsMax: templ.$('#months_max').val(),
                startTime: templ.$('#start_time').val(),
                endTime: templ.$('#end_time').val(),
                multi: $(templ.find('input:radio[name=multi]:checked')).val()
            };
            if(checkValues(values)) {
                AccountsCats.insert(values);
                Materialize.toast("Insertion effectuée", 5000);
                templ.find("form").reset();
            }
        },
        "change input:radio[name=date_var]": function(evt) {
            let newVar = $(evt.target).val();
            if (newVar === "FIX")
                $('#months_max').val("").prop('disabled', true);
            else
                $('#months_max').prop('disabled', false);
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

    Template.AccountsCats$modalAdd.onRendered(function(){
        $('.datepicker').datepicker({
            dateFormat: 'yy-mm-dd'
        });
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
