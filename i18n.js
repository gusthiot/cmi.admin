/**
 * Multi-lingual support.
 */

if (Meteor.isClient) {
  Session.set("i18nLanguages", [
    {code: 'us', language: "English"},
    {code: 'fr', language: "Français"},
    {code: 'de', language: "Deutsch"},
    {code: 'it', language: "Italiano"}
  ]);
  Template.i18nSelectLanguage.helpers({
    languages: function() { return Session.get("i18nLanguages") }
  });
  Template.i18nSelectLanguage.onRendered(function () {
    $(this.find(".selection.dropdown")).dropdown();
  });
}