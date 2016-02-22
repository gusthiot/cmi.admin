/**
 * Multi-lingual support.
 */

I18N = {
  Languages: [
    {code: 'en', language: "English"},
    {code: 'fr', language: "Français"},
    {code: 'de', language: "Deutsch"},
    {code: 'it', language: "Italiano"}
  ]
};

if (Meteor.isClient) {
  Session.set("i18nLanguages", I18N.Languages);
  // TODO: Initialize from browser prefs; set from prefs of logged-in users
  Session.setDefault("i18nCurrentLanguage", "fr");
  Template.i18nSelectLanguage.helpers({
    languages: function() { return Session.get("i18nLanguages") }
  });
  var i18nClientSetupDone = false;
  Template.i18nSelectLanguage.onRendered(function () {
    if (i18nClientSetupDone) { return; } else { i18nClientSetupDone=true; }
    var langMenu = $(this.find(".selection.dropdown"));
    langMenu.dropdown({
      onChange: function (newValue) {
        Session.set("i18nCurrentLanguage", newValue);
      }
    });
    Tracker.autorun(function() {
      var lang = Session.get("i18nCurrentLanguage");
      langMenu.dropdown('set selected', lang);
      TAPi18n.setLanguage(lang);
    });
  });
}
