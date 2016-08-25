/**
 * Navigate around template instances
 */


/**
 * As per http://stackoverflow.com/a/27962713/435004
 * @param levels
 */
Blaze.TemplateInstance.prototype.parent = function (levels) {
    var view = this.view;
    if (typeof levels === "undefined") {
        levels = 1;
    }
    while (view) {
        if (view.name.substring(0, 9) === "Template." && !(levels--)) {
            return view.templateInstance();
        }
        view = view.parentView;
    }
};

/**
 * Find closest parent template instance matching `predicate`
 * @param predicate - A function taking a template instance, and returning a Boolean
 */
Blaze.TemplateInstance.prototype.findParent = function (predicate) {
    var view = this.view;
    while (view) {
        if (view.name.substring(0, 9) === "Template." && predicate(view.templateInstance())) {
            return view.templateInstance();
        }
        view = view.parentView;
    }
};

/**
 * Find the template instance for a given DOM element
 */
Blaze.TemplateInstance.find = function(jquery_or_element) {
    var element = jquery_or_element instanceof jQuery ? jquery_or_element[0] : jquery_or_element;
    if (! element) {
        throw new Meteor.Error("Blaze.TemplateInstance.find expects a non-empty jQuery object or a DOM element");
    }
    return Blaze.getView(element).templateInstance();
};
