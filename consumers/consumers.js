const shared = require("../lib/shared");

const Consumers = new Meteor.Collection("consumers");

Consumers.name = "Consumers";

Consumers.schema = new SimpleSchema({
    sciper: {
        type: SimpleSchema.Integer,
        min: 1
    },
    firstname: {
        type: String
    },
    lastname: {
        type: String
    },
    phone: {
        type: String
    },
    email: {
        type: String
    },
    userId: {
        type: SimpleSchema.Integer,
        min: 1
    },
    login: {
        type: String
    },
    password: {
        type: String
    },
    right: {
        type: Boolean
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

Consumers.columns =
    ["sciper", "firstname", "lastname", "phone", "email", "userId", "login", "password", "right", "creation", "changes",
        "closing"];

Consumers.allow({
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
    Meteor.publish(Consumers.name, function () {
        return Consumers.find({});
    });
}

function makeTable() {
    return shared.makeTable(Consumers, false);
}
let theTable = makeTable();

if (Meteor.isClient) {
    require("../lib/widget/client/widget");
    require("../lib/client/find-templates");

    Meteor.subscribe(Consumers.name);

    Template.Consumers$Edit.find = function (that) {
        if (that === undefined) {
            that = Template.instance();
        }
        if (that instanceof Blaze.TemplateInstance) {
            return Template.instance().findParent("Template." + Consumers.name + "$Edit");
        }
    };

    Template.Consumers$Edit.helpers({makeTable: theTable});

    Session.set('editingRow', 'undefined');
    Session.set('saving', 'undefined');


    Template.Consumers$Edit.events({
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
                let values = shared.getChildrenValues($(event.currentTarget).children(), Consumers.columns);
                if(checkValues(values, 'update')) {
                    let updatingValues = shared.updatingValues(values, Session.get('editingRow'));
                    if(Object.keys(updatingValues).length > 0) {
                        Consumers.update(Session.get('editingRow')._id,
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

    let allCellTemplates = Consumers.columns.map(function (x) {
        return Template["Consumers$cell$" + x]
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

    Template.Consumers$columnHead.events({
        'change select': function (event, template) {
            let val = $.fn.dataTable.util.escapeRegex(
                $(event.target).val()
            );
            template.dataTable.column
                .search(val ? '^' + val + '$' : '', true, false)
                .draw();
        }
    });

    Template.Consumers$columnHead.helpers({
        helpers: {
            translateKey: function (what) {
                return what;
            }
        },
        translate: function (what) {
            return TAPi18n.__("Consumers.column." + what);
        }
    });

    Template.Consumers$cell$right.helpers({
        rights: function () {
            return ["Actif", "Passif"];
        }
    });

    Template.Consumers$cell$save.helpers({
        selected: function () {
            if(Session.get('editingRow') !== 'undefined' && Session.get('editingRow')._id === Template.currentData()._id) {
                return 1;
            }
            return 0;
        }
    });

    Template.Consumers$cell$save.events({
        'click .save': function (event) {
            event.preventDefault();
            Session.set('saving', 'yes');
        }
    });

    Template.Consumers$Pagination.events({
        "click button.previous": function (event, templateInstance) {
            templateInstance.paginate.previous();
        },
        "click button.nexts": function (event, templateInstance) {
            templateInstance.paginate.next();
        }
    });

    Template.Consumers$Pagination.helpers({
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

    Template.Consumers$addButton.onRendered(function () {
        this.$('.modal-trigger').assertSizeEquals(1).leanModal();
    });

    function checkValues(values, mode) {
        if(values.sciper !== "" && !shared.isPositiveInteger(values.sciper)) {
            Materialize.toast("Sciper invalide !", 5000);
        }
        else if((mode === "insert" || (mode === "update") && values.sciper !== Session.get('editingRow').sciper) &&
            (Consumers.find({sciper: values.sciper}).count() > 0)) {
            Materialize.toast("Ce Sciper est déjà utilisé !", 5000);
        }
        else if(values.firstname === "") {
            Materialize.toast("Prénom invalide !", 5000);
        }
        else if(values.lastname === "") {
            Materialize.toast("Nom invalide !", 5000);
        }
        else if(values.email === "" || !validateEmail(values.email)) {
            Materialize.toast("Email invalide !", 5000);
        }
        else if(values.userId === "") {
            Materialize.toast("User Id invalide !", 5000);
        }
        else if((mode === "insert" || (mode === "update") && values.userId !== Session.get('editingRow').userId) &&
            (Consumers.find({userId: values.userId}).count() > 0)) {
            Materialize.toast("Ce User Id est déjà utilisé !", 5000);
        }
        else if(values.login === "") {
            Materialize.toast("Login invalide !", 5000);
        }
        else if((mode === "insert" || (mode === "update") && values.login !== Session.get('editingRow').login) &&
            (Consumers.find({login: values.login}).count() > 0)) {
            Materialize.toast("Ce Login est déjà utilisé !", 5000);
        }
        else return true;
        return false;
    }

    function validateEmail(email) {
        let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    Template.Consumers$modalAdd.events({
        'click .modal-done': function (event, templ) {
            event.preventDefault();
            let values = {
                sciper: templ.$('#sciper').val(),
                firstname: templ.$('#firstname').val(),
                lastname: templ.$('#lastname').val(),
                phone: templ.$('#phone').val(),
                email: templ.$('#email').val(),
                userId: templ.$('#user_id').val(),
                login: templ.$('#login').val(),
                password: templ.$('#password').val(),
                right: $(templ.find('input:radio[name=right]:checked')).val(),
                creation: templ.$('#creation').val(),
                changes: templ.$('#changes').val(),
                closing: templ.$('#closing').val()
            };
            if(checkValues(values, 'insert')) {
                Consumers.insert(values);
                Materialize.toast("Insertion effectuée", 5000);
                templ.find("form").reset();
            }
        }
    });

    Template.Consumers$modalAdd.helpers({
        translate: function (what) {
            return TAPi18n.__("Consumers.column." + what);
        },
        modalAdd: function () {
            return TAPi18n.__("Consumers.modal.add");
        }
    });

    Template.Consumers$cell$remove.events({
        'click .cancelItem': function (event) {
            event.preventDefault();
            let count = Rights.find({consumerId: this._id}).count();
            if (count > 0) {
                Materialize.toast("Suppression impossible, article utilisé " + count
                    + " fois dans la base de données ‘Droits‘", 5000);
            }
            else {
                shared.confirmRemove(this._id, this._id, Consumers);
            }
        }
    });
}
