/**
 * Library of reusable widgets for forms
 *
 * Widgets are reusable Blaze templates that follow Meteor's
 * [recommendations](https://guide.meteor.com/blaze.html#reusable-components),
 * as well as project-specific naming conventions and behavior for CMi AdminBase,
 * described below.
 *
 * Widget templates are named like this: Widget$What, where the What part indicates
 * the type of data that can be displayed or edited by the widget.
 *
 * Widget templates have the following common attributes:
 *
 *    - value
 *    - editable
 *
 * @example myapp.html
 *
 * <template name="MyDatum">
 *   {{> Widget$Select values=myValues editable=myEditableFunc
 *                     helpers=myHelpers }}
 * </template>
 *
 * @example myapp.js
 *
 * Template.MyDatum.helpers({
 *   myValues: () => ["RED", "GREEN", "BLUE"],
 *   myEditableFunc () { return "editable" },
 *   myHelpers: function() {
 *     var myDatum = Template.instance();
 *     return {
 *       translateKey: (k) => TAPi18n.__("MyApp.favoriteColor." + k)
 *     }
 *   }
 * });
 *
 * @see [Patterns and Practices for passing data between templates](https://forums.meteor.com/t/patterns-and-practices-for-passing-data-between-templates/2951/86)
 */

import mapValues from "lodash/mapValues";
import "../../client/find-templates";

var debug = require("debug")("lib/widget/client/widget.js");

/**
 * Widget superclass.
 *
 * @constructor
 */
Widget = function Widget() {
};
export default Widget;

/**
 * Declare a new widget class.
 *
 * @param widgetClassName
 * @returns {Function|*}
 */
Widget.declareClass = function (widgetClassName) {
    var widgetClass = Widget[widgetClassName] = _.extend(Object.create(WidgetBase.prototype),
        {className: widgetClassName});
    widgetClass._createMainTemplate();
    return widgetClass;    // Chainable
};

/**
 * Like lodash's `mapValues` on all subclasses of Widget
 *
 * @param cb     - Called as `cb(widgetSubclass, widgetClassName)`
 * @returns {{}} - A dict whose keys are widget class names, and values are the return values of `cb`
 */
Widget.mapClasses = function (cb) {
    var mapResult = {};
    _.each(_.keys(Widget), function (key) {
        if (Widget[key] instanceof WidgetBase) {
            mapResult[key] = cb(Widget[key], key);
        }
    });
    return mapResult;
};


/**
 * Return the widget object corresponding to an instance
 * of an internal widget template.
 *
 * For use e.g. in event handlers of custom widgets.
 *
 * @param templateInstance - The template instance to start at
 * @returns {Widget}
 */
Widget.find = function (templateInstance) {
    return templateInstance.findParent((p) => p.widget).widget;
};

/************* Widget class methods common to all classes **********************************/

var WidgetBase = function () {
    throw new Error("Should never construct instances");
};

WidgetBase.prototype.mapTemplates = function (cb) {
    var self = this,
        stem = this.templateNamePrefix();

    var mapResult = {};
    mapValues(Template, function (tmpl, name) {
        if (name.startsWith(stem)) {
            mapResult[name] = cb(tmpl, name);
        }
    });
    return mapResult;
};

WidgetBase.prototype.mapEditableTemplates = function (cb) {
    var stem = this.templateNamePrefix();

    var mapResult = {};
    mapValues(Template, function (tmpl, name) {
        if (name.startsWith(stem + "$") && !name.endsWith("$readonly")) {
            mapResult[name] = cb(tmpl);
        }
    });
    return mapResult;
};

WidgetBase.prototype.pickTemplate = function (qualifier_or_bool) {
    var qualifier = (typeof (qualifier_or_bool) === "string") ? qualifier_or_bool :
        qualifier_or_bool ? "editable" : "readonly";
    return this.templateNamePrefix() + "$" + qualifier;
};


WidgetBase.prototype.dataContextForInnerTemplate = function (dataContext) {
    var contextCopy = _.extend({}, dataContext),
        widgetContext = _.extend(contextCopy,
            this.userHelpersAsWidgetContext(this, dataContext.helpers || {}));
    _.extend(contextCopy, {widget: widgetContext});
    return contextCopy;
};

WidgetBase.prototype.templateNamePrefix = function () {
    return "Widget$" + this.className;
};

WidgetBase.prototype._createMainTemplate = function () {
    var self = this,
        templateName = self.templateNamePrefix();
    debug("Creating template " + templateName);
    Template[templateName] = self.template = new Template("Template." + templateName, function realizeWidget() {
        debug((Tracker.currentComputation.firstRun ? "R" : "Re-r") + "ealizing instance of template " + templateName);
        var viewmodel = this.templateInstance().viewmodel,
            currentData = Template.currentData(),
            theRightTemplateName = self.pickTemplate(currentData.editable),
            theRightTemplate = Template[theRightTemplateName];

        if (!theRightTemplate) {
            return Blaze.With({name: theRightTemplateName}, () => Template.Widget$$NotFound.constructView());
        }

        return theRightTemplate ?
            Blaze.With(self.dataContextForInnerTemplate(currentData),
                theRightTemplate.constructView.bind(theRightTemplate)) :
            undefined;
    });
};

WidgetBase.prototype.helpers = function (helpers) {
    this.mapTemplates(function (tmpl) {
        tmpl.helpers(helpers);
    });
    return this;  // Chainable
};

WidgetBase.prototype.viewmodel = function (viewmodelInit) {
    viewmodelInit = _.extend({}, {value: undefined}, viewmodelInit);
    this.mapEditableTemplates(function (tmpl) {
        tmpl.viewmodel(viewmodelInit);
    });
    return this;  // Chainable
};

/**
 * User-overridable helpers
 *
 * @param userHelpers
 * @returns {WidgetBase.prototype}
 */
WidgetBase.prototype.userHelpers = function (userHelpers) {
    this._userHelpers = _.extend(this._userHelpers || {}, userHelpers);
    return this;  // Chainable
};

WidgetBase.prototype.userHelpersAsWidgetContext = function (that, userHelpers) {
    return mapValues(this._userHelpers, function (classHelper, helperName) {
        return function (/* ... arguments passed by widget template */) {
            return classHelper.apply(that,
                _.flatten([[userHelpers[helperName]], arguments], true));
        };
    });
};

/**
 * Comfort alias
 */
WidgetBase.prototype.onCreatedUnder = function (underWhat, cb) {
    return this.template.onCreatedUnder(underWhat, cb);
};

/**
 * Comfort alias
 */
WidgetBase.prototype.onRenderedUnder = function (underWhat, cb) {
    return this.template.onRenderedUnder(underWhat, cb);
};


/******************************* Widget-specific code ****************************************/

/**
 * Widget to <select> from a list of translatable symbols (strings).
 */
Widget.declareClass("Select")
    .helpers({
        maybeSelected: function (selected, value) {
            return (selected === value) ? {selected: 1} : {}
        },
        attributesOfEmptyOption: function () {
            var data = Template.currentData();
            if (_.indexOf(data.widget.values, data.widget.value) > -1) {
                return {selected: 1, disabled: 1};
            } else {
                return {disabled: 1};
            }
        }
    })
    .userHelpers({
        translateKey: function (userHelper, key) {
            return userHelper ? userHelper(key) : key;
        }
    }).viewmodel({
    events: {
        'change select': function (event, templateInstance) {
            this.value(event.target.value);
        }
    }
});
/* Note that widget-specific data dependencies (such as widget.values) need not be declared. */

Widget.declareClass("InputBillableText");

Widget.declareClass("Textarea");

Widget.declareClass("InputUserSearch");


function dateFormatExpectedByDatetimepicker() {
    return 'MM/DD/YYYY hh:mm A';
}

Widget.declareClass("Date")
    .helpers({
        asDatePickerTime: function (time) {
            return moment(time, dateFormatExpectedByDatetimepicker()).format(dateFormatExpectedByDatetimepicker());
        },
        dateToLocalizedString: function(t) {
            if (t === undefined) {
                return undefined;
            }
            var lang = TAPi18n.getLanguage();
            return t.locale(lang).format("LLLL");
        }
    }).viewmodel({
    events: {
        'dp.change input': function(e) {
            // http://eonasdan.github.io/bootstrap-datetimepicker/Events/
            var newDate = e.date;
            this.value(newDate);
        }
    }
});

Template.Widget$Date$editable.onRendered(function () {
    this.$('.startTimeEdit').assertSizeEquals(1).datetimepicker();
});
