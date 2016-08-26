/**
 * Library of reusable widgets for forms
 *
 * Widgets are reusable Blaze templates that follow Meteor's
 * [recommendations](https://guide.meteor.com/blaze.html#reusable-components),
 * as well as project-specific naming conventions and behavior for CMi AdminBase.
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
 *
 *
 * @see [Patterns and Practices for passing data between templates](https://forums.meteor.com/t/patterns-and-practices-for-passing-data-between-templates/2951/86)
 */

import mapValues from "lodash/mapValues";
import "../../client/find-templates";
import { ReactiveVar } from "meteor/reactive-var";

var debug = require("debug")("lib/widget/client/widget.js");

/**
 * Widget superclass.
 *
 * @constructor
 */
Widget = function Widget() {};
export default Widget;

/**
 * Declare a new widget class.
 *
 * @param widgetClassName
 * @returns {Function|*}
 */
Widget.declareClass = function(widgetClassName) {
  var widgetClass;
  widgetClass = Widget[widgetClassName] = function() {
    this._dataValue = new ReactiveVar();
    this._editedValue = new ReactiveVar();
  };

  // Add the class methods and attributes to the new class
  _.extend(widgetClass, {className: widgetClassName}, WidgetClassPrototype);

  // Instances inherit from Widget indirectly, through a per-class prototype
  widgetClass.prototype = Object.create(Widget.prototype);
  widgetClass.prototype.widgetClass = widgetClass;

  widgetClass._createTemplate.call(widgetClass);

  return widgetClass;    // Chainable
};

/**
 * Like lodash's `mapValues` on all subclasses of Widget
 *
 * @param cb     - Called as `cb(widgetSubclass, widgetClassName)`
 * @returns {{}} - A dict whose keys are widget class names, and values are the return values of `cb`
 */
Widget.mapClasses = function(cb) {
  var mapResult = {};
  _.each(_.keys(Widget), function (key) {
    if (Widget[key].prototype instanceof Widget) {
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
Widget.find = function(templateInstance) {
  return templateInstance.findParent((p) => p.widget).widget;
};

/************* Widget instance methods common to all classes **********************************/

Widget.prototype.pickTemplate = function(qualifier_or_bool) {
  var qualifier = (typeof (qualifier_or_bool) === "string") ? qualifier_or_bool :
    qualifier_or_bool ? "editable" : "readonly";
  return this.widgetClass.templateNamePrefix() + "$" + qualifier;
};

Widget.prototype.asDataContext = function(dataContext) {
  var widgetContext = _.extend({}, dataContext,
    this.widgetClass.userHelpersAsWidgetContext(this, dataContext.helpers || {}));
  return {
    widget: widgetContext
  }
};

/**
 * Get or set the underlying data value as a reactive computation.
 */
Widget.prototype.dataValue = function(opt_newValue) {
  if (arguments.length) {
    this._dataValue.set(opt_newValue);
  } else {
    return this._dataValue.get();
  }
};

/**
 * Get or set the value (possibly edited by the user) as a reactive computation.
 */
Widget.prototype.value = function(opt_newValue) {
  if (arguments.length) {
    this._editedValue.set(opt_newValue);
  } else {
    return this._editedValue.get();
  }
};

Widget.prototype.valueEdited = function(newValue) {
  this.value(newValue);
};

/************* Widget class methods common to all classes **********************************/

var WidgetClassPrototype = {};

WidgetClassPrototype.mapTemplates = function(cb) {
  var stem = this.templateNamePrefix();

  var mapResult = {};
  mapValues(Template, function (tmpl, name) {
    if (name.startsWith(stem)) {
      mapResult[name] = cb(tmpl);
    }
  });
  return mapResult;
};

WidgetClassPrototype.templateNamePrefix = function () {
  return "Widget$" + this.className;
};

WidgetClassPrototype._createTemplate = function () {
  var klass=this,
    templateName = klass.templateNamePrefix();
  debug("Creating template " + templateName);
  Template[templateName] = klass.template = new Template("Template." + templateName, function realizeWidget() {
    debug((Tracker.currentComputation.firstRun ? "R" : "Re-r") + "ealizing instance of template " + templateName);
    var widget = this.templateInstance().widget,
      currentData = Template.currentData(),
      theRightTemplateName = widget.pickTemplate(currentData.editable),
      theRightTemplate = Template[theRightTemplateName];

    widget.dataValue(currentData.value);
    // TODO: actually, it depends whether we want to keep the edited state or not.
    widget._editedValue.set(currentData.value);

    return theRightTemplate ?
      Blaze.With(widget.asDataContext(currentData),
        theRightTemplate.constructView.bind(theRightTemplate)) :
      undefined;
  });
  Template[templateName].onCreated(function () {
    debug("Creating instance of template " + templateName);
    // This actually happens *before* realizeWidget() above.
    this.widget = new klass();
  });
};

WidgetClassPrototype.helpers = function(helpers) {
  this.mapTemplates(function (tmpl) {
    tmpl.helpers(helpers);
  });
  return this;  // Chainable
};

/**
 * User-overridable helpers
 *
 * @param userHelpers
 * @returns {WidgetClassPrototype}
 */
WidgetClassPrototype.userHelpers = function(userHelpers) {
  this._userHelpers = _.extend(this._userHelpers || {}, userHelpers);
  return this;  // Chainable
};

WidgetClassPrototype.userHelpersAsWidgetContext = function(that, userHelpers) {
  return mapValues(this._userHelpers, function (classHelper, helperName) {
    return function(/* ... arguments passed by widget template */) {
      return classHelper.apply(that,
        _.flatten([[userHelpers[helperName]], arguments], true));
    };
  });
};

/**
 * Comfort alias
 */
WidgetClassPrototype.onCreatedUnder = function(underWhat, cb) {
  return this.template.onCreatedUnder(underWhat, cb);
};

/**
 * Comfort alias
 */
WidgetClassPrototype.onRenderedUnder = function(underWhat, cb) {
  return this.template.onRenderedUnder(underWhat, cb);
};

/******************************* Widget-specific code ****************************************/

/**
 * Widget to <select> from a list of translatable symbols (strings).
 */
Widget.declareClass("Select")
  .helpers({
    maybeSelected: function(selected, value) {
      return (selected === value) ? {selected: 1} : {}
    },
    attributesOfEmptyOption: function() {
      var data = Template.currentData();
      if (_.indexOf(data.widget.values, data.widget.value) > -1) {
        return { selected: 1, disabled: 1 };
      } else {
        return { disabled: 1 };
      }
    }
  })
  .userHelpers({
    translateKey: function(userHelper, key) {
      return userHelper ? userHelper(key) : key;
    }
  });

/* Note that widget-specific data dependencies (here widget.values) need not be declared. */

Template.Widget$Select$editable.events({
  'change select': function (event, that) {
    Widget.find(that).valueEdited(event.target.value);
  }
});
