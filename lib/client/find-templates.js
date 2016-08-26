/**
 * Navigate around template instances
 */
export default 1;

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
    if ((typeof predicate === "string") && predicate.startsWith("Template.")) {
        var parentName = predicate;
        predicate = function(p) { return p.view.name === parentName };
    }
    while (view) {
        if (view.name.substring(0, 9) === "Template." && predicate(view.templateInstance())) {
            return view.templateInstance();
        }
        view = view.parentView;
    }
};

/**
 * Like Template#onCreated, but only when appearing as a descendant of a template of that name
 * 
 * @param ancestorName
 * @param callback     - Called as callback(ancestor), with the "this" set as the newly created object
 */
Template.prototype.onCreatedUnder = lifecycleUnderMethod("onCreated");

/**
 * Like Template#onRendered, but only when appearing as a descendant of a template of that name
 *
 * @param ancestorName
 * @param callback     - Called as callback(ancestor), with the "this" set as the newly rendered object
 */
Template.prototype.onRenderedUnder = lifecycleUnderMethod("onRendered");

function lifecycleUnderMethod(methodName) {
    return function (ancestorName, callback) {
        if (ancestorName.startsWith("Template.")) {
            this[methodName](function () {
                var self = this,
                  ancestor = self.findParent((p) => p.view.name.startsWith(ancestorName));
                if (ancestor) {
                    callback.call(self, ancestor);
                }
            });
        } else {
            throw new Meteor.Error("Unsupported ancestor name specifier: " + ancestorName);
        }
    };
}

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

