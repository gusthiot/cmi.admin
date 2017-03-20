
const shared = require("../shared");
const debug = require("debug")("prices.js");

Prices = new Meteor.Collection("prices");

Prices.name = "Prices";

Prices.schema = new SimpleSchema({
    entitled: {
        type: String
    },
    natureId: {
        type: String
    }
});

Prices.columns =
    ["entitled", "natureId"];

Prices.allow({
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

function getNatureIdFromEntitled(entitled) {
    return CustomersCats.findOne({entitled: entitled})._id;
}

if (Meteor.isServer) {
    // Prices.remove({});
    if (Prices.find({}).count() === 0) {
        Prices.insert({entitled: "EPFL", natureId: getNatureIdFromEntitled("Interne")});
        Prices.insert({entitled: "Académique Externe", natureId: getNatureIdFromEntitled("Externe Académique")});
        Prices.insert({entitled: "Entreprise Externe", natureId: getNatureIdFromEntitled("Externe Industriel")});
    }

    Meteor.publish(Prices.name, function () {
        return Prices.find({});
    });
}

function makeTable() {
    return shared.makeTable(Prices);
}
let theTable = makeTable();

if (Meteor.isClient) {
    require("../lib/widget/client/widget");
    require("../lib/client/find-templates");

    Meteor.subscribe(Prices.name);

    Template.Prices$Edit.find = function (that) {
        if (that === undefined) {
            that = Template.instance();
        }
        if (that instanceof Blaze.TemplateInstance) {
            return Template.instance().findParent("Template." + Prices.name + "$Edit");
        }
    };

    Template.Prices$Edit.helpers({makeTable: theTable});

    Template.Prices$columnHead.events({
        'change select': function (event, template) {
            let val = $.fn.dataTable.util.escapeRegex(
                $(event.target).val()
            );
            template.dataTable.column
                .search(val ? '^' + val + '$' : '', true, false)
                .draw();
        }
    });

    Template.Prices$columnHead.helpers({
        helpers: {
            translateKey: function (what) {
                if(Template.currentData().value === "natureId")
                    return CustomersCats.findOne({_id: what}).entitled;
                else return what;
            }
        },
    });

    Template.Prices$cell$natureId.helpers({
        helpers: {
            translateKey: function (natureId) {
                return CustomersCats.findOne({_id: natureId}).entitled;
            }
        },
    });

    Template.Prices$Pagination.events({
        "click button.previous": function (event, templateInstance) {
            templateInstance.paginate().previous();
        },
        "click button.next": function (event, templateInstance) {
            templateInstance.paginate().next();
        }
    });

    Template.Prices$Pagination.helpers({
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

    Template.Prices$addButton.onRendered(function () {
        this.$('.modal-trigger').assertSizeEquals(1).leanModal();
    });

    Template.Prices$modalAdd.events({
        'click .modal-done': function (event, templ) {
            event.preventDefault();
            Prices.insert({entitled: templ.$('#entitled').val(), natureId:templ.$('#nature').val()});
            templ.find("form").reset();
        }
    });

    Template.Prices$modalAdd.helpers({
        natures: function () {
            return CustomersCats.find({});
        }
    });

    Template.Prices$nature.onRendered(function(){
        $('#nature').material_select();
    });

    Template.Prices$cell$remove.events({
        'click .cancelItem': function (event) {
            event.preventDefault();
            if(confirm("remove \"" + this.entitled + "\" ?")) {
                Prices.remove({_id:this._id});
            }
        }
    });

}
