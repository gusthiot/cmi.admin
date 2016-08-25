/**
 * Library of reusable widgets for forms
 *
 * Widgets are reuseable Blaze templates that follow Meteor's
 * [recommendations](https://guide.meteor.com/blaze.html#reusable-components),
 * as well as project-specific naming conventions for CMi AdminBase.
 *
 * @example myapp.html
 *
 * <template name="MyElement">
 *   {{> Widget$Select values=myValues editable=myEditableFunc
 *                     translateKey=myTranslation onCreated=obtainTheWidgetObject }}
 * </template>
 *
 * @example myapp.js
 *
 * Template.MyElement.helpers({
 *   myValues: ["RED", "GREEN", "BLUE"],
 *   myEditableFunc () { return "editable"},
 *   myTranslation: function(k) {
 *     return return TAPi18n.__("MyForm.Colors." + k);.
 *   }
 *   obtainTheWidgetObject: function (widget) {
 *   }
 * });
 *
 * @seealso
 * https://forums.meteor.com/t/patterns-and-practices-for-passing-data-between-templates/2951/86
 */

import mapValues from "lodash/mapValues";

var debug = require("debug")("lib/client/widget.js");

/**
 * Widget superclass.
 *
 * @constructor
 */
Widget = function Widget() {};

var widgetClassNames = {};
Widget.mapClasses = function(cb) {
  var mapResult = {};
  _.each(widgetClassNames, function (unused_value, key) {
    mapResult[key] = cb(Widget[key], key);
  });
  return mapResult;
};

/**
 * Return the Template.dynamic parameters that render a widget
 *
 * This is meant to be invoked from the owner template like this:
 *
 * @example
 * {{> Template.dynamic (Widget.Select) }}
 *
 * (also exported for gallery.js)
 *
 * @param {Object} widgetName    The name of the widget e.g. Select
 * @param {Object} instance      Template instance to use as the 'this' in callbacks
 * @param {Object} widgetOptions Widget options hash as passed e.g. to .widget()
 * @return {Object} Parameters for passing to Template.dynamic
 */
Widget._templateDynamic = function(widgetName, instance, widgetOptions) {
  var widgetClass = Widget[widgetName];
  if (! widgetClass) {
    return {
      template: "Widget$$NotFound",
      data: {
        name: JSON.stringify(widgetName) || String(widgetName)
      }
    };
  }

  var widget = new widgetClass();
  widget.helpers = _.extend(widgetClass.defaultHelpers, widgetOptions);
  instance.widget = widget;

  return {
    template: widget.pickTemplate(callWidgetUserFunc(instance, "editable"))
  };
};

/**
 * @callback editableCallback
 *
 * User-provided reactive computation returning the editable or read-only status of a widget
 *
 * @this {Widget}
 * @return {Object} True if the widget is editable, false if not, or the name of a custom
 *                  editability style e.g. "disabled"
 */

/**
 * @callback valueCallback
 *
 * User-provided reactive computation returning the value to show in the widget
 *
 * @this {Widget}
 * @return {object}
 */

/**
 * @callback mergeCallback
 *
 * User-provided function telling what to do in case of an edit conflict
 *
 * @this {Widget}
 * @return XXX TODO
 */

/**
 * Declare that this template has a widget inside and configure it.
 *
 * @memberOf Template
 *
 * @param {object}           widgetOptions
 * @param {editableCallback} widgetOptions.editable
 * @param {valueCallback}    widgetOptions.value
 * @param {valueCallback}    widgetOptions.merge
 */
Template.prototype.widget = function () {
  var self = this;
  self.helpers({
    Widget () {
      var instance = Template.instance();
      return Widget.mapClasses(function (unused_class, className) {
        return function() {
          return widgetTemplateDynamic(className, instance, instance._widgetHelpers || {});
        }
      });
    }
  });
  return {
    inputs: function(inputs) {
      this.onCreated(function () {
        this._widgetHelpers = _.extend(this._widgetHelpers || {}, inputs);
      });
    },
    onChanged: function(cb) {
      this.onCreated(function () {
        this._widgetHelpers = _.extend(this._widgetHelpers || {}, inputs);
      });
    }
  }
};

/**
 * Common methods for all widgets
 *
 * @type {Object}
 */

var WidgetPrototype = {},
  WidgetClassPrototype = {};

/**
 * Declare a new widget class.
 *
 * @param widgetClassName
 * @returns {Function|*}
 */
Widget.declareClass = function(widgetClassName) {
  var widgetClass;
  widgetClass = Widget[widgetClassName] = function() {
    // Delegate this method to the class:
    this.changed = WidgetClassPrototype.changed.bind(widgetClass);
  };

  widgetClassNames[widgetClassName] = true;  // Make Widget.mapClasses() work
  widgetClass._changedCallbacks = [];

  _.extend(widgetClass.prototype, WidgetPrototype);
  widgetClass.className = widgetClass.prototype.className = widgetClassName;

  _.extend(widgetClass, WidgetClassPrototype);

  widgetClass.helpers(commonWidgetHelpers);
  return widgetClass;    // Chainable
};

WidgetPrototype.pickTemplate = function(qualifier_or_bool) {
  var qualifier = (typeof (qualifier_or_bool) === "string") ? qualifier_or_bool :
    qualifier_or_bool ? "editable" : "readonly";
  return "Widget" + "$" + this.className + "$" + qualifier;
};

/**
 * Called by widget-specific code when the value changes.
 */
WidgetClassPrototype.changed = function(newVal) {
  var self = this;
  _.each(this._changedCallbacks, (cb) => {cb.call(self, newVal)});
};

WidgetClassPrototype.onChanged = function(cb) {
  this._changedCallbacks.push(cb);
};

WidgetClassPrototype.helpers = function(helpers) {
  this.mapTemplates(function(tmpl) {
    tmpl._widgetHelpers = _.extend(tmpl._widgetHelpers || {}, helpers);
    tmpl.helpers({
      widget()  {
        var instance = Template.instance();
        return mapValues(tmpl._widgetHelpers, (helper) => helper.bind(instance));
      }
    });
  });
  return this;  // Chainable
};

WidgetClassPrototype.defaultHelpers = {
  translateKey: function (k) {
    return k;
  }
};

WidgetClassPrototype.mapTemplates = function(cb) {
  var stem = "Widget$" + this.className;

  var mapResult = {};
  mapValues(Template, function (tmpl, name) {
    if (name.startsWith(stem)) {
      mapResult[name] = cb(tmpl);
    }
  });
  return mapResult;
};

/*
 * Private helpers for widget templates
 *
 * @this Template instance
 */
function deferToUserSuppliedCallback(cbName, opt_defaultValue) {
  return function(/* args */) {
    var widgetInstance = this.findParentWidget();
    var value = callWidgetUserFunc(widgetInstance, cbName, arguments);
    return (value === undefined) ? opt_defaultValue : value;
  }
}

var commonWidgetHelpers = {
  translateKey: deferToUserSuppliedCallback("translateKey"),
  value: deferToUserSuppliedCallback("value")
};

/*
 * Private methods and class methods
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
  });

Template.Widget$Select$editable.events({
  'change select': function (event, that) {
    that.findParentWidget().widget.changed(event.target.value);
  }
});