if (Meteor.isClient) {
  /* Monkey-patch to work around bugs #281 and #282 */
  Template.tabular.onRendered(function() {
    this.tabular.isLoading = {
      get: function() { return false; },
      set: function() {}
    }
  });
}

Tabular.newReactiveTable = function(options) {
  var columns = options.columns;
  if (columns instanceof Function) {
    if (Meteor.isClient) {
      options.columns = [];
      Template.tabular.onRendered(function() {
        var self = this;
        self.autorun(function() {
          // Clone to defeat equality check:
          var options = _.clone(self.tabular.options.get());
          options.columns = columns();
          self.tabular.options.set(options);
        });
      });
    } else {
      options.columns = columns();
    }
  }
  return new Tabular.Table(options);
}
