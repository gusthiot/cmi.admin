/*
 * A widget gallery to show off widgets and aid in their development
 */

import flatMap from 'lodash/flatMap';
import "../../client/find-templates";
import Widget from "./widget";

var debug = require("debug")("lib/widget/client/gallery.js");

/* Set up the top-level (table) template */
Router.route('/devsupport/widgets', function () {
  this.render("Widget$Gallery$gallery");
});

/* Show all widgets */
Template.Widget$Gallery$gallery.helpers({
  widgets: function () {
    return _.values(Widget.mapClasses(function (unused_class, className) {
      return className;
    }));
  }
});

/* The moar template */
Template.Widget$Gallery$moar.helpers({
  moar () {
    var moar = [],
      count = Template.instance().moarCount.get();
    for(var i = 0; i < count; i++) {
      moar.push(i === count - 1 ? {isLast: true} : {});
    }
    return moar;
  }
});

Template.Widget$Gallery$moar.onCreated(function () {
  var moarCount = this.moarCount = new ReactiveVar(1);
  moarCount.bump = function() {
    moarCount.set(1 + Tracker.nonreactive(() => moarCount.get()));
  }
});

/**
 * The behavior for a gallery item.
 *
 * Instances are stateless; each corresponds to a widget *class*.
 * All necessary state is maintained in the template instance, allowing
 * each gallery item to be shown multiple times.
 *
 * @param widgetClassName
 * @constructor
 */
Widget.Gallery = function Gallery(widgetClassName) {
  if (Widget.Gallery[widgetClassName]) {
    throw new Meteor.Error(widgetClassName + " created twice");
  }
  this.widgetClassName = widgetClassName;
  Widget.Gallery[widgetClassName] = this;

  var thisGalleryItem = this;
  _.each(Widget.Gallery._onCreate, function(task) {
    task.call(thisGalleryItem, widgetClassName);
  })
};

/**
 * Do `cb` on all existing gallery items.
 * @param cb
 * @returns {{}}
 */
Widget.Gallery.mapValues = function(cb) {
  var mapResult = {};
  _.each(_.keys(Widget.Gallery), function (key) {
    if (Widget.Gallery[key].prototype instanceof Widget.Gallery) {
      mapResult[key] = cb.call(Widget.Gallery[key], key);
    }
  });
  return mapResult;
};

Widget.Gallery._onCreate = [];

/**
 * Do `cb` on all existing and future galleries.
 * @param cb
 */
Widget.Gallery.onAll = function(cb) {
  Widget.Gallery.mapValues(function(galleryItemName) {
    cb.call(this, galleryItemName);
  });
  Widget.Gallery._onCreate.push(cb);
};

/* Create any Widget.Gallery items that we missed by .startup() time. This makes
 * it possible to not add any code to gallery.js for simple widgets
 */
Meteor.startup(function() {
  Widget.mapClasses(function(unused_class, widgetClassName) {
    if (! Widget.Gallery[widgetClassName]) {
      new Widget.Gallery(widgetClassName);
    }
  })
});

/**
 * Compute suitable parameters to Template.dynamic to render a widget inside the gallery.
 * @param itemInstance A template instance of the Widget$Gallery$item template
 * @returns {{template: string, data: Object}}
 */
Widget.Gallery.prototype.widgetParams = function(itemInstance) {
  return {
      template: "Widget$" + this.widgetClassName,
      data: {
        value: itemInstance.externalValue.get(),
        editable: itemInstance.viewmodel.editability()
      }
  }
};

Widget.Gallery.prototype.parseValue = function(v) {return v};
Widget.Gallery.prototype.unparseValue = function(v) {return v};

/*********** Common template configuration ****************/

Template.Widget$Gallery$item.onCreated(function () {
    this.externalValue = new ReactiveVar();  // Set by synthetic event in onRendered
});

Widget.Gallery.onAll(function (galleryItemName) {
  var widgetClassName = this.widgetClassName;
  // Make last created instance available to browser console as Widget.Gallery.Foo.instance
  Widget[widgetClassName].mapTemplates(function (tmpl) {
    tmpl.onCreated(function () {
      if (Widget.Gallery[widgetClassName]) {
        Widget.Gallery[widgetClassName].instance = this;
      }
    })
  });
  // "Downlink" data binding (from widget state to "Current value" gallery field)
  Widget[this.widgetClassName].mapEditableTemplates(function (tmpl) {
    tmpl.onRenderedUnder("Template.Widget$Gallery$item",
        function (under) {
          var viewmodel = this.viewmodel;
          under.autorun(function() {
            var value;
            if (viewmodel && viewmodel.value) {
              value = viewmodel.value();
            } else {
              // For widget classes that don't have a .viewmodel() yet
              value = undefined;
            }
            if (value) {
              var galleryObj = Widget.Gallery[under.data.wid];
              under.$("input.external-value").val(galleryObj.unparseValue(value));
            }
          });
        }
    );
  });
});

Template.Widget$Gallery$item.viewmodel({
  editabilities: ["readonly", "editable"],
  editability: "readonly"
});

Template.Widget$Gallery$item.helpers({
  widgetHere (widgetClassName) {
    return Widget.Gallery[widgetClassName].widgetParams(Template.instance(), this);
  },
  moreControls (widgetClassName) {
    return {
      template: "Widget$Gallery$MoreControls$" + widgetClassName,
      data: {}
    }
  },
  widgetInitialValue (widgetClassName) {
    var value = Widget.Gallery[widgetClassName].initialValue;
    return (value === undefined) ? {} : {value: value};
  },
});

Template.Widget$Gallery$item.onRendered(function () {
  // Simulate a change to load the correct value into the widget
  this.$('input.external-value').trigger("change");
});

Template.Widget$Gallery$item.events({
  "click .moar": function(event, that) {
    that.findParent("Template.Widget$Gallery$moar").moarCount.bump();
  },
  "change input.external-value": function (event, that) {
    var galleryObj = Widget.Gallery[that.data.wid];
    that.externalValue.set(galleryObj.parseValue(event.target.value));
  }
});

function findGalleryItemTemplateInstance(tmpl) {
  var parent = tmpl.findParent("Template.Widget$Gallery$item");
  if (! parent) {
    throw Meteor.Error("Parent gallery item template instance not found");
  }
  return parent;
}

/**** Per-widget scaffolding for the gallery  ****/

new Widget.Gallery("Select");

Widget.Gallery.Select.initialValue = "RED";

Widget.Gallery.Select.widgetParams = function (itemInstance) {
  if (! itemInstance.allowedValues) {
    itemInstance.allowedValues = new ReactiveVar();
  }
  var widgetParams = Widget.Gallery.prototype.widgetParams.call(this, itemInstance);
  widgetParams.data.values = itemInstance.allowedValues.get();
  widgetParams.data.helpers = {
    translateKey: function (k) {
      return TAPi18n.__("WidgetGallery.colorName." + k);
    }
  };
  return widgetParams;
};

Template.Widget$Gallery$MoreControls$Select.onRendered(function () {
  // Simulate a change to load the correct allowedValues as per above
  this.$('textarea').trigger("blur");
});

Template.Widget$Gallery$MoreControls$Select.events({
  "blur textarea": function (event, that) {
    var parsed = that.$("textarea").val().split("\n"),
      hasUndef = parsed[0] === "",
      values = flatMap(parsed, (s) => (s.trim() ? [s.trim()] : []));
    if (hasUndef) {
      values.unshift(undefined);
    }
    findGalleryItemTemplateInstance(that).allowedValues.set(values);
  }
});

/* Parse / unparse moment objects for Widget.Date, yow! */
Meteor.startup(function () {
  _.each(["Date", "Time", "DateTime"], function (widgetShortName) {
      Widget.Gallery[widgetShortName].parseValue = function(v) {
        if (v === "") {
          return moment();
        }
        try {
          return eval(v);
        } catch (e) {
          console.log("Cannot make sense of value for Widget$" + widgetShortName + ": " + e);
          return undefined;
        }
      };
      Widget.Gallery[widgetShortName].unparseValue = function(t) {
        if (t === undefined) {
          return "";
        }
        return "moment(\"" + t.toISOString() + "\")";
      };
  });
});

///////////////////////////// Demo use-case

Template.Widget$Gallery$example.helpers({
  myFavoriteColors: () => ["RED", "GREEN", "BLUE"],
  myEditableFunc () { return "editable" },
  myHelpers: function() {
    var templateInstance = Template.instance();
    return {
      translateKey: function (k) {
        return TAPi18n.__("WidgetGallery.colorName." + k);
      },
    }
  }
});

Template.Widget$Select$editable.onRenderedUnder("Template.Widget$Gallery$example", function (under) {
  var viewmodel = this.viewmodel;
  under.autorun(function() {
    var value = viewmodel.value();
    if (value) {
      under.$('div').css('background-color', value.toLowerCase());
    }
  });
});
