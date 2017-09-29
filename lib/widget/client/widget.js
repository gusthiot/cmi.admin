/**
 * # Library of reusable widgets for forms
 *
 * Widgets are reusable Blaze templates that follow Meteor's
 * [recommendations](https://guide.meteor.com/blaze.html#reusable-components),
 * as well as project-specific naming conventions and behavior for CMi AdminBase,
 * described below.
 *
 * ## Using widgets
 *
 * Widget templates are named like this: Widget$Select, Widget$Textarea etc,
 * where the part after Widget$ indicates the type of data that can be displayed
 * or edited with that widget.
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
 * ## Writing widgets
 *
 * Declare a new widget type like this:
 *
 * @example
 *
 * Widget.declareClass("MyWidget")
 *     .helpers({...})
 *     .viewmodel({...})
 *
 * widget.js builds on top of Blaze and manuel:viewmodel; this is where the .helpers and .viewmodel
 * methods come from (You can also get at onCreated, onRendered and so forth through .viewmodel).
 *
 * Widgets have an auto-generated top-level template Widget$MyWidget, and a number of sub-templates
 * like Widget$MyWidget$readonly, Widget$MyWidget$editable etc. that you need to declare like
 * any other Blaze template. Widget$MyWidget renders into one of these, depending on the "editable"
 * parameter passed to it. Calling .helpers or .viewmodel (as above) on the widget class, is equivalent
 * to doing same on each and every template whose name starts with Widget$MyWidget$.
 *
 * # See also
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
    widgetClass.helpers({
        widget: widgetClass._widgetNamespace.bind(widgetClass),
    });
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

/**
 * @returns The template data passed to the top-level widgt template
 */
Widget.data = function() {
    // TODO: this only works for templates invoked directly by Widget$MyWidget
    // If the need arises, we'll need to theach this function to walk up the
    // template tree
    return Template.currentData();
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
        if ((name === stem) || name.startsWith(stem + "$")) {
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

WidgetBase.prototype.templateNamePrefix = function () {
    return "Widget$" + this.className;
};

WidgetBase.prototype._createMainTemplate = function () {
    var self = this,
        templateName = self.templateNamePrefix();
    debug("Creating template " + templateName);
    Template[templateName] = self.template = new Template("Template." + templateName, function realizeWidget() {
        debug((Tracker.currentComputation.firstRun ? "R" : "Re-r") + "ealizing instance of template " + templateName);
        var currentData = Template.currentData(),
            theRightTemplateName = self.pickTemplate(currentData.editable),
            theRightTemplate = Template[theRightTemplateName];

        if (!theRightTemplate) {
            return Blaze.With({name: theRightTemplateName}, () => Template.Widget$$NotFound.constructView());
        }

        return theRightTemplate.constructView();
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
 * Instated at declareClass() time as the "widget" helper on each of the widget's templates.
 * @returns {Object} Things that can be accessed as widget.foo from a widget template.
 * @private
 */
WidgetBase.prototype._widgetNamespace = function () {
    var self = this,
      dataContext = Widget.data(),
      widgetNamespace = _.extend({}, dataContext);
    mapValues(this._userHelpers, function (classHelper, helperName) {
        widgetNamespace[helperName] = function (/* ... arguments passed by widget template */) {
            var userHelper = (dataContext && dataContext.helpers) ?
              dataContext.helpers[helperName] :
              undefined;
            return classHelper.apply(self,
              _.flatten([[userHelper], arguments], true));
        };
    });
    return widgetNamespace;
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
            var data = Widget.data();
            var emptyIsSelected = (_.indexOf(data.values, data.value) === -1);
            var emptyIsDisabled = (_.indexOf(data.values, undefined) === -1 );
            var attributes = {};
            if (emptyIsSelected) {
                attributes["selected"] = 1;
            }
            if (emptyIsDisabled) {
                attributes["disabled"] = 1;
            }
            return attributes;
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

Widget.declareClass("InputText");

Widget.declareClass("Textarea");

Widget.declareClass("User");

// =======================================================================================
// ========================== Widget$Date (using datePicker) =============================

Widget.declareClass("Date");

Template.Widget$Date$editable.onRendered(function () {
    $('.datepicker').datepicker({
        dateFormat: 'yy-mm-dd'
    });
    this.$(".datepicker").datepicker("setDate", new Date(Widget.data().value));
});

// =======================================================================================
// ================= Widget$Time (using senthilraj.github.io/TimePicki) ==================

function toMoment(dateOrMoment) {
    if (! dateOrMoment) {
        throw new Meteor.Error("Cannot set Widget$Time value to type " + typeof(dateOrMoment));
    }
    if (! (dateOrMoment instanceof moment)) {
        dateOrMoment = moment(dateOrMoment);
    }
    return dateOrMoment;
}

Widget.declareClass("Time")
    .helpers({
        toTimepickerInputValue: function () {
            if (! this.value) return "";
            return moment(this.value).format('HH:mm');
        },

        timeToLocalizedString: function() {
            var m = this.value;
            if (m === undefined) {
                return undefined;
            }
            m = moment(m);
            var lang = TAPi18n.getLanguage();
            return m.locale(lang).format("LT");
        }
    }).viewmodel({
        value: ViewModel.property.object.convertIn(toMoment),
    });

Template.Widget$Time$editable.onRendered(function () {
    var self = this;
    self.changed = function() {
        var oldMoment = self.viewmodel.value(),
            newHour = self.$("input.timepicker").attr("data-timepicki-tim"),
            newMinute = self.$("input.timepicker").attr("data-timepicki-mini");

        var newMoment = moment({
            hour: newHour ? 0 + newHour : oldMoment.hour(),
            minute: newMinute ? 0 + newMinute : oldMoment.minute(),
            second: 0,
        });

        self.viewmodel.value(newMoment);
    };

    // http://senthilraj.github.io/TimePicki/options.html#
    var viewmodel = this.viewmodel,
        timepickiStartTime = [],
        timepickiSettings = {
            custom_classes:"timeColor",
            show_meridian:false,
            min_hour_value:0,
            max_hour_value:23,
            disable_keyboard_mobile: true,
            on_change: function(ele) {
                self.changed();
            },
            start_time: timepickiStartTime
        };
    self.$('input.timepicker').assertSizeEquals(1).timepicki(timepickiSettings);

    // open_timepicki() opens up with: set_date(settings.start_time)
    function updateStartTimeInSettings() {
        timepickiStartTime[0] = viewmodel.value().format('HH');
        timepickiStartTime[1] = viewmodel.value().format('mm');
    }
    updateStartTimeInSettings();
    this.autorun(updateStartTimeInSettings);
});

// ================= Combined Date and Time ================================

Widget.declareClass("DateTime")
  .helpers({
      dateTimeToLocalizedString: function(t) {
          var m = moment(new Date(t));
          if (m === undefined) {
              return undefined;
          }
          var lang = TAPi18n.getLanguage();
          return m.locale(lang).format("l LT");
      }
  })
  .viewmodel({
      value: ViewModel.property.object.convertIn(toMoment),
      onRendered: function () {
          var vm = this;
          this.templateInstance.autorun(function () { // updateValueOnSubwidgetsUpdated
              var children = vm.childrenByTag();
              if (! (children.date && children.time)) {
                  // Template is being destroyed
                  return;
              }
              var prevDateTime = moment(vm.value.value),  // Non-reactive read
                  date = children.date.value(),
                  time = moment(children.time.value()),
                  newDateTime = moment({
                    year:   date.year(),
                    month:  date.month(),
                    date:   date.date(),
                    hour:   time.hour(),
                    minute: time.minute(),
                  });
              if (newDateTime.isSame(prevDateTime)) { return; }
              debug("Widget$DateTime: value(%s)", newDateTime);
              vm.value(newDateTime);
          });
      }
  });

ViewModel.prototype.childrenByTag = function () {
    var result = {};
    _.each( this.children(), function (child) {
        if (child.vmTag) {
            result[child.vmTag()] = child;
        }
    } );
    return result;
};