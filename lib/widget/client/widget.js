/**
 * Library of reusable widgets for forms
 *
 * Widgets are reusable Blaze templates that follow Meteor's
 * [recommendations](https://guide.meteor.com/blaze.html#reusable-components),
 * as well as project-specific naming conventions and behavior for CMi AdminBase.
 *
 * @example myapp.html
 *
 * <template name="MyElement">
 *   {{> Widget$Select values=myValues editable=myEditableFunc
 *                     callbacks=myCallbacks }}
 * </template>
 *
 * @example myapp.js
 *
 * Template.MyElement.helpers({
 *   myValues: () => ["RED", "GREEN", "BLUE"],
 *   myEditableFunc () { return "editable" },
 *   myCallbacks: {
 *    translateKey: (k) => TAPi18n.__("MyApp.favoriteColor." + k),
 *    widgetCreated: function(widget) {
 *      // Use it and/or lose it
 *    }
 *  }
 * });
 *
 *
 *
 * @see [Patterns and Practices for passing data between templates](https://forums.meteor.com/t/patterns-and-practices-for-passing-data-between-templates/2951/86)
 */

import mapValues from "lodash/mapValues";

var debug = require("debug")("lib/client/widget.js");

/**
 * Widget superclass.
 *
 * @constructor
 */
Widget = function Widget() {};

/**
 * Declare a new widget class.
 *
 * @param widgetClassName
 * @returns {Function|*}
 */
Widget.declareClass = function(widgetClassName) {
  var widgetClass;
  widgetClass = Widget[widgetClassName] = function() {};

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

/************* Widget instance methods common to all classes **********************************/

Widget.prototype.pickTemplate = function(qualifier_or_bool) {
  var qualifier = (typeof (qualifier_or_bool) === "string") ? qualifier_or_bool :
    qualifier_or_bool ? "editable" : "readonly";
  return this.widgetClass.templateNamePrefix() + "$" + qualifier;
};

Widget.prototype.asDataContext = function(dataContext) {
  var widgetContext = _.extend({}, dataContext,
    this.widgetClass.callbacksAsWidgetContext(this.membrane(), dataContext.callbacks));
  return {
    widget: widgetContext
  }
};

/**
 * @return {Object} the "this" passed to user-supplied callbacks
 */
Widget.prototype.membrane = function () {
  return _.extend(Object.create(this.widgetClass.prototype), {
    // Watch this space
  });
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
  Template[templateName] = new Template(templateName, function() {
    var widget;
    debug((Tracker.currentComputation.firstRun ? "" : "Re-") + "rendering template " + templateName);
    if (Tracker.currentComputation.firstRun) {
      widget = this.templateInstance().widget = new klass();
    } else {
      widget = this.templateInstance().widget;
      if (Devsupport.isActive() && ! widget) {
        throw new Meteor.Error('widget object ought to have been created on first template render');
      }
    }
    var currentData = Template.currentData(),
      theRightTemplateName = widget.pickTemplate(currentData.editable),
      theRightTemplate = Template[theRightTemplateName];
    return theRightTemplate ?
      Blaze.With(widget.asDataContext(currentData),
        theRightTemplate.constructView.bind(theRightTemplate)) :
      undefined;
  });
};

WidgetClassPrototype.helpers = function(helpers) {
  this.mapTemplates(function (tmpl) {
    tmpl.helpers(helpers);
  });
  return this;  // Chainable
};

WidgetClassPrototype.callbacks = function(userCallbacks) {
  this._callbacks = _.extend(this._callbacks || {}, userCallbacks);
  return this;  // Chainable
};

WidgetClassPrototype.callbacksAsWidgetContext = function(that, userCallbacks) {
  return mapValues(this._callbacks, function (classCallback, callbackName) {
    return function(/* ... arguments passed by widget template */) {
      return classCallback.apply(that,
        _.flatten([[userCallbacks[callbackName]], arguments], true));
    };
  });
};



/*
 * Private functions
 */

function callWidgetUserFunc(tmplInstance, callbackName, opt_callbackArgs) {
  var widget = tmplInstance.widget;
  if (! widget) return;
  var cb = widget.helpers[callbackName];
  if (! cb) return;
  return cb.apply(tmplInstance, opt_callbackArgs || []);
}

/******************************* Widget-specific code ****************************************/

/**
 * Widget to <select> from a list of translatable symbols (strings).
 */

Widget.declareClass("Select")
  .helpers({
    maybeSelected: function(selected, value) {
      return (selected === value) ? {selected: 1} : {}
    }
  })
  .callbacks({
    translateKey: function(userCallback, key) {
      return userCallback ? userCallback(key) : key;
    }
  });

Template.Widget$Select$editable.events({
  'change select': function (event, that) {
    that.findParentWidget().widget.changed(event.target.value);
  }
});