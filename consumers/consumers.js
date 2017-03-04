if (Meteor.isClient) {
    require("../lib/widget/client/widget");
    require("../lib/client/find-templates");
}

var debug = require("debug")("consumers.js");

Consumers = new Meteor.Collection("consumers");

var Schemas = {};

Schemas.Consumer = new SimpleSchema({
    sciper: {
        type: SimpleSchema.Integer,
        min: 1
    },
    firstname: {
        type: String
    },
    lastname: {
        type: String
    },
    phone: {
        type: String
    },
    email: {
        type: String
    },
    id: {
        type: SimpleSchema.Integer,
        min: 1
    },
    login: {
        type: String
    },
    password: {
        type: String
    },
    rights: {
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

Consumers.attachSchema(Schemas.Consumer);

Consumers.columns =
    ["sciper", "firstname", "lastname", "phone", "email", "id", "login", "password", "rights", "creation", "changes",
        "closing"];

if (Meteor.isClient) {
    Meteor.subscribe('Consumers');
}


if (Meteor.isClient) {
    Template.Consumers$Edit.find = function (that) {
        if (that === undefined) {
            that = Template.instance();
        }
        if (that instanceof Blaze.TemplateInstance) {
            return Template.instance().findParent("Template.Consumers$Edit");
        }
    }
}


if (Meteor.isServer) {
    // This code only runs on the server
    Meteor.publish('Consumers', function () {
        return Consumers.find({});
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
