
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

if (Meteor.isServer) {
    // CustomersCats.remove({});
    if (CustomersCats.find({}).count() == 0) {
        CustomersCats.insert({entitled: "Internal", codeN:"I"});
        CustomersCats.insert({entitled: "Academic External", codeN:"A"});
        CustomersCats.insert({entitled: "Industrial External", codeN:"E"});
    }

    Meteor.publish(CustomersCats.name, function () {
        console.log("published : " + CustomersCats.find({}).count());
        return CustomersCats.find({});
    });
}

console.log("class " + CustomersCats.find({}).count());

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

    Template.CustomersCats$Edit.helpers({makeTable: shared.makeTable(CustomersCats)});

    console.log("is client : " + CustomersCats.find({}).count());

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
            templateInstance.paginate.previous();
        },
        "click button.next": function (event, templateInstance) {
            templateInstance.paginate.next();
        }
    });
}

