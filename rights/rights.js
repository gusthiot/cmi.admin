if (Meteor.isClient) {
    require("../lib/widget/client/widget");
    require("../lib/client/find-templates");
}

var debug = require("debug")("rules.js");

Rights = new Meteor.Collection("rights");

var Schemas = {};

Schemas.Right = new SimpleSchema({
    consumerId: {
        type: SimpleSchema.Integer,
        min: 1
    },
    accountId: {
        type: SimpleSchema.Integer,
        min: 1
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    }
});

Rights.attachSchema(Schemas.Right);

Rights.columns =
    ["consumerId", "accountId", "startTime", "endTime"];

if (Meteor.isClient) {
    Meteor.subscribe('Rights');
}


if (Meteor.isClient) {
    Template.Rights$Edit.find = function (that) {
        if (that === undefined) {
            that = Template.instance();
        }
        if (that instanceof Blaze.TemplateInstance) {
            return Template.instance().findParent("Template.Rights$Edit");
        }
    }
}


if (Meteor.isServer) {
    // This code only runs on the server
    Meteor.publish('Rights', function () {
        return Rights.find({});
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
