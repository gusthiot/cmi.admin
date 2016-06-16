/**
 * Multi-lingual support.
 */

I18N = {
  Languages: [
    {code: 'en', language: "English"},
    {code: 'fr', language: "Français"},
    {code: 'de', language: "Deutsch"},
    {code: 'it', language: "Italiano"}
  ],
  browserLanguage: function() {
    // TODO: unstub
    return "fr";
  }
};

var currentLanguage = function() {
  var user = Meteor.user();
  return user ? user.lang() : undefined;
};

if (Meteor.isClient) {
  Session.set("i18nLanguages", I18N.Languages);

  Meteor.startup(function() {
    Tracker.autorun(function() {
      TAPi18n.setLanguage(currentLanguage());
    });
  });

  Template.I18N$SelectLanguage.helpers({
    languages: function() { return Session.get("i18nLanguages") },
    currentLanguage: currentLanguage
  });
  Template.I18N$SelectLanguage.onRendered(function () {
    $(this.findAll(".dropdown-menu a.flag")).click(function() {
      var newLang = $(this).data('value');
      Meteor.user().lang(newLang);
    });
  });
}
