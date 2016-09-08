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
  },
  galleryItem: function(widgetName, isLast, opts) {
    return {
      template: "Widget$Gallery$item$" + widgetName,
      data: _.extend({}, opts.hash, {
        wid: widgetName,
        isLast: isLast
      })
    };
  }
});

Template.Widget$Gallery$moar.onCreated(function () {
  var moarCount = this.moarCount = new ReactiveVar(1);
  moarCount.bump = function() {
    moarCount.set(1 + Tracker.nonreactive(() => moarCount.get()));
  }
});

Template.Widget$Gallery$$genericItem.events({
  "click .moar": function(event, that) {
    that.findParent("Template.Widget$Gallery$moar").moarCount.bump();
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
Widget.Gallery = function GalleryItem(widgetClassName) {
  if (Widget.Gallery[widgetClassName]) {
    throw new Meteor.Error(widgetClassName + " created twice");
  }
  this.widgetClassName = widgetClassName;
  Widget.Gallery[widgetClassName] = this;
  this.makeTemplate();

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
 * Create the Template.Widget$Gallery$item$foo for this gallery item.
 *
 * Decorating the template (with `.onCreated`, `.helpers` etc) is done
 * elsewhere.
 */
Widget.Gallery.prototype.makeTemplate = function() {
  var theGallery = this,
    templateName = "Widget$Gallery$item$" + this.widgetClassName;
  Template[templateName] = this.template = new Template("Template." + templateName, function() {
    var widget;
    debug((Tracker.currentComputation.firstRun ? "" : "Re-") + "rendering template " + templateName);
    if (Tracker.currentComputation.firstRun) {
      this.gallery = theGallery;
    }
    return Template.Widget$Gallery$$genericItem.constructView();
  });
};

Widget.Gallery.prototype.asTemplateData = function(templateInstance, templateData) {
  return {
    value: templateInstance.externalValue.get(),
    editable: templateInstance.editability.get(),
    helpers: {
      translateKey: function (k) {
        return TAPi18n.__("WidgetGallery.colorName." + k);
      }
    }
  };
};

/*********** Common template configuration ****************/

Widget.Gallery.onAll(function (galleryItemName) {
  this.template.onCreated(function () {
    this.externalValue = new ReactiveVar();  // Set by synthetic event in onRendered
    this.editability = new ReactiveVar("readonly");
    this.parseValue = function(v) {return v};  // Unless overridden below
    this.unparseValue = function(v) {return v};  // Unless overridden below
  });
  var widgetClassName = this.widgetClassName;
  // Make last created instance available to browser console as GalleryItem.Foo.instance
  Widget[widgetClassName].mapTemplates(function (tmpl) {
    tmpl.onCreated(function () {
      if (GalleryItem[widgetClassName]) {
        GalleryItem[widgetClassName].instance = this;
      }
    })
  });

  var itemTemplateName = "Template.Widget$Gallery$item$" + this.widgetClassName;
  Widget[this.widgetClassName].mapEditableTemplates(function (tmpl) {
    tmpl.onRenderedUnder(itemTemplateName,
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
              under.$("input.external-value").val(under.unparseValue(value));
            }
          });
        }
    );
  });
});

/* Helpers and events also go on the parent $$genericItem, not .onAll */
Template.Widget$Gallery$$genericItem.helpers({
  widgetHere (widgetClassName) {
    return {
      template: "Widget$" + widgetClassName,
      data: Widget.Gallery[widgetClassName].asTemplateData(findGalleryItemTemplateInstance(Template.instance()), this)
    };
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

Template.Widget$Gallery$$genericItem.onRendered(function () {
  // Simulate a change to load the correct value into the widget
  this.$('input.external-value').trigger("change");
});

Template.Widget$Gallery$$genericItem.events({
  "change input.external-value": function (event, that) {
    var galleryItemTemplate = findGalleryItemTemplateInstance(that);
    galleryItemTemplate.externalValue.set(galleryItemTemplate.parseValue(event.target.value));
  },
  "change select.editability": function (event, that) {
    findGalleryItemTemplateInstance(that).editability.set(event.target.value);
  }
});

function findGalleryItemTemplateInstance(tmpl) {
  var parent = tmpl.findParent((p) =>
    p.view.name.startsWith("Template.Widget$Gallery$item$"));
  if (! parent) {
    throw Meteor.Error("Parent gallery item template instance not found");
  }
  return parent;
}

/**** Per-widget scaffolding for the gallery  ****/

new Widget.Gallery("Select");

Widget.Gallery.Select.initialValue = "RED";

Widget.Gallery.Select.template.onCreated(function() {
  this.allowedValues = new ReactiveVar();
});

Widget.Gallery.Select.asTemplateData = function (templateInstance, templateData) {
  return _.extend(Widget.Gallery.prototype.asTemplateData(templateInstance, templateData), {
    values: templateInstance.allowedValues.get(),
  });
};

Template.Widget$Gallery$MoreControls$Select.onRendered(function () {
  // Simulate a change to load the correct allowedValues into the widget
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

/* Parse / unparse DateTime objects for Widget.Date, yow! */
Meteor.startup(function () {
  Template.Widget$Gallery$item$Date.onCreated(function () {
    this.parseValue = function(v) {
      if (v === "") {
        return moment.utc();
      }
      try {
        return eval(v);
      } catch (e) {
        console.log("Cannot make sense of Widget.Date value: " + e);
        return undefined;
      }
    };
    this.unparseValue = function(t) {
      if (t === undefined) {
        return "";
      }
      return "moment(\"" +
              t.toISOString() +
          "\")";
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
