if (Meteor.isClient) {
    require("../lib/widget/client/widget");
    require("../lib/client/find-templates");
}

var debug = require("debug")("accounts_categories.js");

AccountsCats = new Meteor.Collection("accounts_categories");

var Schemas = {};

Schemas.AccountsCat = new SimpleSchema({
    entitled: {
        type: String
    },
    accountCode: {
        type: String
    },
    multi: {
        type: Boolean
    }
});

AccountsCats.attachSchema(Schemas.AccountsCat);

AccountsCats.columns =
    ["entitled", "accountCode", "multi"];

if (Meteor.isClient) {
    Meteor.subscribe('AccountsCats');
}


if (Meteor.isClient) {
    Template.AccountsCats$Edit.find = function (that) {
        if (that === undefined) {
            that = Template.instance();
        }
        if (that instanceof Blaze.TemplateInstance) {
            return Template.instance().findParent("Template.AccountsCats$Edit");
        }
    }
}


if (Meteor.isServer) {
    // This code only runs on the server
    Meteor.publish('AccountsCats', function () {
        return AccountsCats.find({});
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
