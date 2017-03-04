if (Meteor.isClient) {
    require("../lib/widget/client/widget");
    require("../lib/client/find-templates");
}

var debug = require("debug")("rules.js");

Prices = new Meteor.Collection("prices");

var Schemas = {};

Schemas.Price = new SimpleSchema({
    entitled: {
        type: String //,
        // allowedValues: ["EPFL", "Academic External", "Entreprise External"]
    },
    nature: {
        type: String
    }
});

Prices.attachSchema(Schemas.Price);

Prices.columns =
    ["entitled", "nature"];

if (Meteor.isClient) {
    Meteor.subscribe('Prices');
}


if (Meteor.isClient) {
    Template.Prices$Edit.find = function (that) {
        if (that === undefined) {
            that = Template.instance();
        }
        if (that instanceof Blaze.TemplateInstance) {
            return Template.instance().findParent("Template.Prices$Edit");
        }
    }
}


if (Meteor.isServer) {
    // This code only runs on the server
    Meteor.publish('Prices', function () {
        return Prices.find({});
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
