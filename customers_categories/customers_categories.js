
const shared = require("../shared");
const debug = require("debug")("rules.js");

CustomersCats = new Meteor.Collection("customers_categories");

CustomersCats.name = "CustomersCats";

CustomersCats.schema = new SimpleSchema({
    entitled: {
        type: String
    },
    codeN: {
        type: String
    }
});

CustomersCats.columns =
    ["entitled", "codeN"];

CustomersCats.allow({
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
    // CustomersCats.remove({});
    if (CustomersCats.find({}).count() == 0) {
        CustomersCats.insert({entitled: "Interne", codeN:"I"});
        CustomersCats.insert({entitled: "Externe Académique", codeN:"A"});
        CustomersCats.insert({entitled: "Externe Industriel", codeN:"E"});
    }

    Meteor.publish(CustomersCats.name, function () {
        return CustomersCats.find({});
    });
}

function makeTable() {
    return shared.makeTable(CustomersCats);
}
let theTable = makeTable();

if (Meteor.isClient) {
    require("../lib/widget/client/widget");
    require("../lib/client/find-templates");

    Meteor.subscribe(CustomersCats.name);

    Template.CustomersCats$Edit.find = function (that) {
        if (that === undefined) {
            that = Template.instance();
        }
        if (that instanceof Blaze.TemplateInstance) {
            return Template.instance().findParent("Template.CustomersCats$Edit");
        }
    };

    Template.CustomersCats$Edit.helpers({makeTable: theTable});

    Template.CustomersCats$columnHead.helpers({
        helpers: {
            translateKey: function (what) {
                return what;
            },
        },
    });

    Template.CustomersCats$columnHead.events({
        'change select': function (event, template) {
            let val = $.fn.dataTable.util.escapeRegex(
                $(event.target).val()
            );
            template.dataTable.column
                .search(val ? '^' + val + '$' : '', true, false)
                .draw();
        }
    });

    Template.CustomersCats$Pagination.events({
        "click button.previous": function (event, templateInstance) {
            templateInstance.paginate().previous();
        },
        "click button.next": function (event, templateInstance) {
            templateInstance.paginate().next();
        }
    });

    Template.CustomersCats$Pagination.helpers({
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

    Template.CustomersCats$addButton.onRendered(function () {
        this.$('.modal-trigger').assertSizeEquals(1).leanModal();
    });

    Template.CustomersCats$cell$modalCategory.events({
        'click .modal-done': function (event, templ) {
            event.preventDefault();
            CustomersCats.insert({entitled: templ.$('#entitled').val(), codeN:templ.$('#code_n').val()});
        }
    });

    Template.CustomersCats$cell$remove.events({
        'click .cancelItem': function (event) {
            event.preventDefault();
            if(confirm("remove \"" + this.entitled + "\" ?")) {
                console.log("remove " + this._id);
                CustomersCats.remove({_id:this._id});
            }
        }
    });
}
