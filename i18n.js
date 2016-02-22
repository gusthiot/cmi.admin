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

var currentLanguage = function() {
  var user = User.current();
  return user ? user.lang() : undef;
};

if (Meteor.isClient) {
  Meteor.startup(function() {
    Tracker.autorun(function() {
      TAPi18n.setLanguage(currentLanguage());
    });
  });

  I18N.browserLanguage = function() {
    // TODO: unstub
    return "fr";
  };
  Session.set("i18nLanguages", I18N.Languages);

  Template.I18N$SelectLanguage.helpers({
    languages: function() { return Session.get("i18nLanguages") },
    currentLanguage: currentLanguage
  });
  Template.I18N$SelectLanguage.onRendered(function () {
    var button = $(this.find(".selection.dropdown"));
    $(this.findAll(".dropdown-menu i.flag")).click(function() {
      var newLang = $(this).data('value');
      User.current().lang(newLang);
      button.dropdown("toggle");
    });
  });
}
