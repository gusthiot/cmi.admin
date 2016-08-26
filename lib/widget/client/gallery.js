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

Template.Widget$Gallery$gallery.helpers({
  galleryItem: (widgetName, opts) => ({
    template: "Widget$Gallery$item$" + widgetName,
    data: _.extend({}, opts, {
      wid: widgetName
    })
  }),
  moarWidgets: () => [{}, {isLast: true}]  // TODO: react to the "+" button
});

/* Show all widgets */
Template.Widget$Gallery$gallery.helpers({
  widgets: function () {
    return _.values(Widget.mapClasses(function (unused_class, className) {
      return className;
    }));
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
GalleryItem = function GalleryItem(widgetClassName) {
  if (GalleryItem[widgetClassName]) {
    throw new Meteor.Error(widgetClassName + " created twice");
  }
  this.widgetClassName = widgetClassName;
  GalleryItem[widgetClassName] = this;
  this.makeTemplate();

  var thisGalleryItem = this;
  _.each(GalleryItem._onCreate, function(task) {
    task.call(thisGalleryItem);
  })
};

/**
 * Do `cb` on all existing gallery items.
 * @param cb
 * @returns {{}}
 */
GalleryItem.mapValues = function(cb) {
  var mapResult = {};
  _.each(_.keys(GalleryItem), function (key) {
    if (GalleryItem[key].prototype instanceof GalleryItem) {
      mapResult[key] = cb.call(GalleryItem[key]);
    }
  });
  return mapResult;
};

GalleryItem._onCreate = [];

/**
 * Do `cb` on all existing and future galleries.
 * @param cb
 */
GalleryItem.onAll = function(cb) {
  GalleryItem.mapValues(function() {
    cb.call(this);
  });
  GalleryItem._onCreate.push(cb);
};

/* Create any GalleryItem's that we somehow missed by .startup() time */
Meteor.startup(function() {
  Widget.mapClasses(function(unused_class, widgetClassName) {
    try {
      new Gallery(widgetClassName);
    } catch (e) {
      // Nothing
    }
  })
});

/**
 * Create the Template.Widget$Gallery$item$foo for this gallery item.
 *
 * Decorating the template (with `.onCreated`, `.helpers` etc) is done
 * elsewhere.
 */
GalleryItem.prototype.makeTemplate = function() {
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

GalleryItem.prototype.asTemplateData = function(templateInstance, templateData) {
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

GalleryItem.onAll(function () {
  this.template.onCreated(function () {
    this.externalValue = new ReactiveVar();  // Set by synthetic event in onRendered
    this.editability = new ReactiveVar("readonly");
  });

  var itemTemplateName = "Template.Widget$Gallery$item$" + this.widgetClassName;
  Widget[this.widgetClassName].onRenderedUnder(itemTemplateName,
    function (under) {
      var widget = this.widget;
      under.autorun(function() {
        var value = widget.value();
        if (value) {
          under.$("input.external-value").val(value);
        }
      });
    }
  );
});

/* Helpers and events go on the generic item template, not .onAll */
Template.Widget$Gallery$$genericItem.helpers({
  widgetHere (widgetClassName) {
    return {
      template: "Widget$" + widgetClassName,
      data: GalleryItem[widgetClassName].asTemplateData(findGalleryItemTemplateInstance(Template.instance()), this)
    };
  },
  moreControls (widgetClassName) {
    return {
      template: "Widget$Gallery$MoreControls$" + widgetClassName,
      data: {}
    }
  },
  widgetInitialValue (widgetClassName) {
    var value = GalleryItem[widgetClassName].initialValue;
    return (value === undefined) ? {} : {value: value};
  }
});

Template.Widget$Gallery$$genericItem.onRendered(function () {
  // Simulate a change to load the correct value into the widget
  this.$('input.external-value').trigger("change");
});

Template.Widget$Gallery$$genericItem.events({
  "change input.external-value": function (event, that) {
    findGalleryItemTemplateInstance(that).externalValue.set(event.target.value);
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

new GalleryItem("Select");

GalleryItem.Select.initialValue = "RED";

GalleryItem.Select.template.onCreated(function() {
  GalleryItem.Select.anInstance = this;
  this.allowedValues = new ReactiveVar();
});

GalleryItem.Select.asTemplateData = function (templateInstance, templateData) {
  return _.extend(GalleryItem.prototype.asTemplateData(templateInstance, templateData), {
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

Template.Widget$Select.onCreatedUnder("Template.Widget$Gallery$example", function (under) {
  console.log("Demo widget created");
});

Template.Widget$Select.onRenderedUnder("Template.Widget$Gallery$example", function (under) {
  var widget = this.widget;
  under.autorun(function() {
    var value = widget.value();
    if (value) {
      under.$('div').css('background-color', value.toLowerCase());
    }
  });
});
