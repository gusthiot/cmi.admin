/**
 * Enhancements to aldeed:meteor-tabular
 */

/* Monkey-patch to work around bugs #281 and #282 */
if (Meteor.isClient) {
  Template.tabular.onRendered(function() {
    this.tabular.isLoading = {
      get: function() { return false; },
      set: function() {}
    }
  });
}

/* Import the extensions we use */
if (Meteor.isClient) {
  Meteor.startup(function(){
    require("./tabular/imports/dataTables.select.js")(window, $);
  });
}

/**
 * Table i18n
 */
var langAssetFiles = {
  fr: "tabular/French.lang",
  de: "tabular/German.lang",
  en: "tabular/English.lang",
  it: "tabular/Italian.lang"
};

/* Translate table-related widgets */
if (Meteor.isServer) {
  Meteor.publish("tabular.translations", function(lang) {
    var self = this;
    var json = Assets.getText(langAssetFiles[lang]);
    var translations = eval("var translations = " + json + "; translations");
    self.added("tabular.translations", lang, translations);
  });
  Tabular.Translations = {
    getCurrent: function() {}
  };
} else if (Meteor.isClient) {
  Tabular.Translations = new Meteor.Collection("tabular.translations");
  Meteor.startup(function() {
    Tracker.autorun(function () {
      var me = Meteor.user();
      if (! me) return;
      Meteor.subscribe("tabular.translations", me.lang());
    });
  });
  Tabular.Translations.getCurrent = function() {
    var user = Meteor.user();
    if (!user) return;
    return Tabular.Translations.find({_id: user.lang()}).fetch()[0];
  };
}
