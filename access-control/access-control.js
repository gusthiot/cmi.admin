/**
 * Access control mechanisms
 *
 * This file is for mechanism only – See policy.js for the policy
 */
var Widget;

if (Meteor.isClient) {
    Widget = require("../lib/widget/client/widget");
    require("../lib/client/find-templates");
}

var debug = require("debug")("access-control.js");

/******** Tequila *********/

Tequila.options.bypass.push("/images/**");
if (Meteor.isClient) {
    Tequila.options.autoStart = false;
}

// In Meteor.users documents, the _id is the user's SCIPER:
Tequila.options.getUserId = function getUserId(tequilaResponse) {
    return Meteor.users.findOne({_id: tequilaResponse.uniqueid});
};

function signalServerError(module) {
    var i18nClass = module + "Error";  // i.e. TequilaError, BecomeError
    return function (error) {
        if (!error) return;
        var i18nKey = (error instanceof Meteor.Error) ? error.error : String(error);
        alert(TAPi18n.__("AccessControl." + i18nClass + "." + i18nKey));
    };
}

Tequila.options.onServerError = signalServerError("Tequila");

/**** Becoming another user *********/

Become.policy(function (uid_from, uid_to) {
    Policy.canBecomeAnotherUser.check({userId: uid_from});
    return true;
});

/********** Access control UI ****************/
if (Meteor.isClient) {
    function canBecome() {
        try {
            Policy.canBecomeAnotherUser.check(Meteor.user());
            return true;
        } catch (e) {
            return false;
        }
    }

    Template.AccessControl$WhoAmI.helpers({
        user: function () {
            return Meteor.user()
        },
        canBecome: canBecome,
        hasBecome: function () {
            return false
        }
    });
    Template.AccessControl$BecomeModal.helpers({canBecome: canBecome});
/*
    Template.User$Pick.events({
        'user:selected #AccessControlBecomeThisUser': function (event, that, id) {
            console.log("become become : " + id);
            Become.become(id, signalServerError("Become"));
            event.preventDefault();
        }
    });
*/
    Template.AccessControl$BecomeModal.events({
        'click .modal-done': function (event, templ) {
            if(templ.$('a.user')[0]) {
                let id = templ.$('a.user')[0].dataset.value;
                Become.become(id, signalServerError("Become"));
            }
            else {
                console.log("no correct selected");
            }
        }
    });

    Template.AccessControl$WhoAmI.events({
        'click #unbecome': Become.restore
    });

    Template.AccessControl$WhoAmI.helpers({
        hasBecome: function () {
            return !!Become.realUser();
        },
        realUser: function () {
            return Become.realUser();
        }
    });

    Template.AccessControl$BtnBecome.onRendered(function () {
        this.$('.modal-trigger').leanModal();
    });
}
