// As per http://stackoverflow.com/a/27962713/435004

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

Blaze.TemplateInstance.prototype.findParent = function (predicate) {
    var view = this.view;
    while (view) {
        if (view.name.substring(0, 9) === "Template." && predicate(view.templateInstance())) {
            return view.templateInstance();
        }
        view = view.parentView;
    }
};
