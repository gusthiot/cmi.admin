if (Meteor.isClient) {
    require("../lib/widget/client/widget");
    require("../lib/client/find-templates");
}

var debug = require("debug")("rules.js");

CustomersCats = new Meteor.Collection("customers_categories");

var Schemas = {};

Schemas.CustomersCat = new SimpleSchema({
    entitled: {
        type: String //,
        // allowedValues: ["Internal", "Academic External", "Industrial External"]
    },
    codeN: {
        type: String //,
        // allowedValues: ["I", "A", "E"]
    }
});

CustomersCats.attachSchema(Schemas.CustomersCat);

CustomersCats.columns =
    ["entitled", "codeN"];

if (Meteor.isClient) {
    Meteor.subscribe('CustomersCats');
}


if (Meteor.isClient) {
    Template.CustomersCats$Edit.find = function (that) {
        if (that === undefined) {
            that = Template.instance();
        }
        if (that instanceof Blaze.TemplateInstance) {
            return Template.instance().findParent("Template.CustomersCats$Edit");
        }
    }
}


if (Meteor.isServer) {
    // This code only runs on the server
    Meteor.publish('CustomersCats', function () {
        return CustomersCats.find({});
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
