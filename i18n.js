/**
 * Multi-lingual support.
 */

if (Meteor.isClient) {
  Template.i18nSelectLanguage.helpers({
    languages: [
      {code: 'us', language: "English"},
      {code: 'fr', language: "Français"},
      {code: 'de', language: "Deutsch"},
      {code: 'it', language: "Italiano"}
    ]
  });
  Template.i18nSelectLanguage.onRendered(function () {
    function select2ifyWithFlags(opt) {
      return "<i class=\"flag flag-" + opt.id + "\"></i>";
    }
    $(".i18nSelectLanguage").select2({
      minimumResultsForSearch: Infinity,  // Hide search box
      formatResult: select2ifyWithFlags,
      formatSelection: select2ifyWithFlags
    });
  });
}