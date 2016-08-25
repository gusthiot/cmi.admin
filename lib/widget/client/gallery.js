/*
 * A widget gallery to show off widgets and aid in their development
 */

import flatMap from 'lodash/flatMap';

Template.Widget$Gallery$gallery.helpers({
  galleryItemOf () {
    return {template: "Widget$Gallery$test2"};
  },
  myFavoriteColors: ["RED", "GREEN", "BLUE"],
  myEditableFunc () { return "editable"},
  myTranslation (k) { return TAPi18n.__("WidgetGallery.colorName." + k)}
});

Template.Widget$Gallery$test2 = new Template("Widget$Gallery$test2", function() {
  return Blaze.With({world: "world!"},
    Template.Widget$Gallery$test.constructView.bind(Template.Widget$Gallery$test));
});

var Gallery = function Gallery(widgetClassName) {
  if (Gallery[widgetClassName]) return;
  this.widgetOptions = {
    value: function () {
      return this.externalValue.get();
    },
    editable: function() {
      return this.editability.get();
    }
  };
  this.onWidgetCreated = function(cb) {
    if (! this._widgetCreatedCallbacks) {
      this._widgetCreatedCallbacks = [];
    }
    this._widgetCreatedCallbacks.push(cb);
  };
  Gallery[widgetClassName] = this;
};

Meteor.startup(() => {
  Widget.mapClasses(function (widgetClass, widgetClassName) {
    new Gallery(widgetClassName);
    widgetClass.onChanged(function(value) {
      $("#widget-gallery-" + widgetClassName + " input.external-value").val(value);
    });
  });
});

function fireGalleryCreatedCallbacks(widgetClassName, instance) {
  if (! instance._galleryCreated) {
    _.each(Gallery[widgetClassName]._widgetCreatedCallbacks || [],
      function(cb) {cb.call(instance)});
  }
  instance._galleryCreated = true;
}

Router.route('/devsupport/widgets', function () {
  this.render("Widget$Gallery$gallery");
});

Template.Widget$Gallery$gallery.helpers({
  widgets: function () {
    return _.values(Widget.mapClasses(function (unused_class, className) {
      return className;
    }));
  }
});

Template.Widget$Gallery$item.onCreated(function() {
  this.externalValue = new ReactiveVar();  // Set by synthetic event in onRendered
  this.editability = new ReactiveVar("readonly");
});

Template.Widget$Gallery$item.helpers({
  widgetHere (widgetClassName) {
    var templateDynamicArgs = Widget._templateDynamic(widgetClassName, Template.instance(),
      Gallery[widgetClassName].widgetOptions);
    fireGalleryCreatedCallbacks(widgetClassName, Template.instance());
    return templateDynamicArgs;
  },
  moreControls (widgetClassName) {
    return {
      template: "Widget$Gallery$MoreControls$" + widgetClassName,
      data: {}
    }
  },
  widgetInitialValue (widgetClassName) {
    var value = Gallery[widgetClassName].initialValue;
    return (value === undefined) ? {} : {value: value};
  }
});

Template.Widget$Gallery$item.events({
  "change input.external-value": function (event, that) {
    that.externalValue.set(event.target.value);
  },
  "change select.editability": function (event, that) {
    that.editability.set(event.target.value);
  }
});

Template.Widget$Gallery$item.onRendered(function () {
  this.$('input.external-value').trigger("change");
});

function findGalleryItemTemplate(tmpl) {
  return tmpl.findParent( (p) => p.view.name === "Template.Widget$Gallery$item");
}

/**** Per-widget scaffolding for the gallery  ****/

new Gallery("Select");

Gallery.Select.initialValue = "Red";

Gallery.Select.onWidgetCreated(function() {
  window.Select = this;
  this.allowedValues = new ReactiveVar();
});
_.extend(Gallery.Select.widgetOptions, {
  values: function() { return this.allowedValues.get(); }
});

Template.Widget$Gallery$MoreControls$Select.onRendered(function () {
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
    findGalleryItemTemplate(that).allowedValues.set(values);
  }
});