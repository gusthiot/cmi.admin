if (Meteor.isClient) {
    require("../lib/widget/client/widget");
    require("../lib/client/find-templates");
}

var debug = require("debug")("consumers.js");

Customers = new Meteor.Collection("customers");

var Schemas = {};

Schemas.Customer = new SimpleSchema({
    codeSAP: {
        type: SimpleSchema.Integer,
        min: 1
    },
    name: {
        type: String
    },
    numAdd: {
        type: SimpleSchema.Integer,
        min: 1
    },
    address: {
        type: String
    },
    postalBox: {
        type: String
    },
    npa: {
        type: SimpleSchema.Integer,
        min: 1
    },
    city: {
        type: String
    },
    country: {
        type: String
    },
    countryCode: {
        type: String
    },
    codeCMi: {
        type: String
    },
    abbreviation: {
        type: String
    },
    name2: {
        type: String
    },
    name3: {
        type: String
    },
    nature: {
        type: String
    },
    price: {
        type: String
    },
    rule: {
        type: String
    },
    baseFee: {
        type: Number,
        min: 0
    },
    fixedFee: {
        type: Number,
        min: 0
    },
    coefA: {
        type: SimpleSchema.Integer,
        min: 1
    },
    creation: {
        type: String
    },
    changes: {
        type: String
    }
});

Customers.attachSchema(Schemas.Customer);

Customers.columns =
    ["codeSAP", "name", "numAdd", "address", "postalBox", "npa", "city", "country", "countryCode", "codeCMi",
        "abbrevation", "name2", "name3", "nature", "price", "rule", "basefee", "fixedFee", "coefA", "creation",
        "changes"];

if (Meteor.isClient) {
    Meteor.subscribe('Customers');
}


if (Meteor.isClient) {
    Template.Customers$Edit.find = function (that) {
        if (that === undefined) {
            that = Template.instance();
        }
        if (that instanceof Blaze.TemplateInstance) {
            return Template.instance().findParent("Template.Customers$Edit");
        }
    }
}


if (Meteor.isServer) {
    // This code only runs on the server
    Meteor.publish('Customers', function () {
        return Customers.find({});
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
