
const shared = require("../shared");
const debug = require("debug")("rules.js");

Rules = new Meteor.Collection("rules");

Rules.name = "Rules";

Rules.schema = new SimpleSchema({
    entitled: {
        type: String
    },
    rule: {
        type: String
    }
});

Rules.columns =
    ["entitled", "rule"];

Rules.allow({
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
    // Rules.remove({});
    if (Rules.find({}).count() == 0) {
        Rules.insert({entitled: "Pas d’émolument si pas d’activité en salle blanche", rule:"NON"});
        Rules.insert({entitled: "Émolument à payer tous les mois", rule:"OUI"});
        Rules.insert({entitled: "Pas d’émolument si zéro article", rule:"ZERO"});
    }

    Meteor.publish(Rules.name, function () {
        return Rules.find({});
    });
}

function makeTable() {
    return shared.makeTable(Rules);
}
let theTable = makeTable();

if (Meteor.isClient) {
    require("../lib/widget/client/widget");
    require("../lib/client/find-templates");

    Meteor.subscribe(Rules.name);

    Template.Rules$Edit.find = function (that) {
        if (that === undefined) {
            that = Template.instance();
        }
        if (that instanceof Blaze.TemplateInstance) {
            return Template.instance().findParent("Template." + Rules.name + "$Edit");
        }
    };

    Template.Rules$Edit.helpers({makeTable: theTable});

    Template.Rules$columnHead.events({
        'change select': function (event, template) {
            let val = $.fn.dataTable.util.escapeRegex(
                $(event.target).val()
            );
            template.dataTable.column
                .search(val ? '^' + val + '$' : '', true, false)
                .draw();
        }
    });

    Template.Rules$Pagination.events({
        "click button.previous": function (event, templateInstance) {
            templateInstance.paginate().previous();
        },
        "click button.next": function (event, templateInstance) {
            templateInstance.paginate().next();
        }
    });

    Template.Rules$Pagination.helpers({
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

    Template.Rules$addButton.onRendered(function () {
        this.$('.modal-trigger').assertSizeEquals(1).leanModal();
    });

    Template.Rules$cell$modalCategory.events({
        'click .modal-done': function (event, templ) {
            event.preventDefault();
            Rules.insert({entitled: templ.$('#entitled').val(), rule:templ.$('#rule').val()});
        }
    });

    Template.Rules$cell$remove.events({
        'click .cancelItem': function (event) {
            event.preventDefault();
            if(confirm("remove \"" + this.entitled + "\" ?")) {
                console.log("remove " + this._id);
                Rules.remove({_id:this._id});
            }
        }
    });
}
