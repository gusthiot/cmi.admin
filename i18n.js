/**
 * Multi-lingual support.
 */

if (Meteor.isClient) {
  Session.set("i18nLanguages", [
    {code: 'en', language: "English"},
    {code: 'fr', language: "Français"},
    {code: 'de', language: "Deutsch"},
    {code: 'it', language: "Italiano"}
  ]);
  // TODO: Initialize from browser prefs; set from prefs of logged-in users
  Session.setDefault("i18nCurrentLanguage", "fr");
  Template.i18nSelectLanguage.helpers({
    languages: function() { return Session.get("i18nLanguages") },
  });
  Template.i18nSelectLanguage.onRendered(function () {
    var langMenu = $(this.find(".selection.dropdown"));
    // TODO: If no value yet, select one from Session.get("i18nCurrentLanguage")
    langMenu.dropdown({
      onChange: function (newValue) {
        Session.set("i18nCurrentLanguage", newValue);
      }
    });
    Tracker.autorun(function() {
      langMenu.dropdown('set selected', Session.get("i18nCurrentLanguage"));
    });
  });
  Template.i18nPoorMansTest.helpers({
    greeting: function() {
      var lang = Session.get("i18nCurrentLanguage");
      var greetings = {
        fr: "Bonjour",
        it: "Buon giorno",
        en: "Hello",
        de: "Guten Tag",
      };
      return greetings[lang];
    }
  })
}
