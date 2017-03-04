if (Meteor.isClient) {
    require("../lib/widget/client/widget");
    require("../lib/client/find-templates");
}

var debug = require("debug")("consumers.js");

CustomerAccounts = new Meteor.Collection("customer_accounts");

var Schemas = {};

Schemas.CustomerAccount = new SimpleSchema({
    id: {
        type: SimpleSchema.Integer,
        min: 1
    },
    number: {
        type: String
    },
    entitled: {
        type: String
    },
    customerCode: {
        type: String
    },
    accountType: {
        type: String
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    state: {
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

CustomerAccounts.attachSchema(Schemas.CustomerAccount);

CustomerAccounts.columns =
    ["id", "number", "entitled", "customerCode", "accountType", "startTime", "endTime", "state", "creation", "changes",
        "closing"];

if (Meteor.isClient) {
    Meteor.subscribe('CustomerAccounts');
}


if (Meteor.isClient) {
    Template.CustomerAccounts$Edit.find = function (that) {
        if (that === undefined) {
            that = Template.instance();
        }
        if (that instanceof Blaze.TemplateInstance) {
            return Template.instance().findParent("Template.CustomerAccounts$Edit");
        }
    }
}


if (Meteor.isServer) {
    // This code only runs on the server
    Meteor.publish('CustomerAccounts', function () {
        return CustomerAccounts.find({});
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
