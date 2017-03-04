if (Meteor.isClient) {
    require("../lib/widget/client/widget");
    require("../lib/client/find-templates");
}

var debug = require("debug")("rules.js");

Rules = new Meteor.Collection("rules");

var Schemas = {};

Schemas.Rule = new SimpleSchema({
    entitled: {
        type: String //,
        // allowedValues: ["No fee if no cleanroom activity", "Fee to be paid monthly", "No fee if zero item"]
    },
    rule: {
        type: String //,
        //allowedValues: ["No", "Yes", "Zero"]
    }
});

Rules.attachSchema(Schemas.Rule);

Rules.columns =
    ["entitled", "rule"];

if (Meteor.isClient) {
    Meteor.subscribe('Rules');
}


if (Meteor.isClient) {
    Template.Rules$Edit.find = function (that) {
        if (that === undefined) {
            that = Template.instance();
        }
        if (that instanceof Blaze.TemplateInstance) {
            return Template.instance().findParent("Template.Rules$Edit");
        }
    }
}


if (Meteor.isServer) {
    // This code only runs on the server
    Meteor.publish('Rules', function () {
        return Rules.find({});
    });
}


function toast(template, err) {
    var toastTemplateArgs;
    if (err) {
        toastTemplateArgs = {error: err};
    }
    var $toastContent = Blaze.toHTMLWithData(template, toastTemplateArgs);
    Materialize.toast($toastContent, 5000);
}
