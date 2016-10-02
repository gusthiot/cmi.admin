/**
 * Multi-lingual support.
 */

/**
 * A supported language.
 *
 * @constructor
 */
function Language(fields) {
  _.extend(this, fields);
}

I18N = {
  Language: Language,
  Languages: {
    order: ["en", "fr", "de", "it"],
    en: new Language({ code: "en", name: "English" }),
    fr: new Language({ code: "fr", name: "Français" }),
    de: new Language({ code: "de", name: "Deutsch" }),
    it: new Language({ code: "it", name: "Italiano "})
  },
};

I18N.browserLanguage = function() {
  // TODO: unstub
  return "fr";
};

/**
 *
 * @returns {undefined}
 */
var currentLanguage = I18N.Language.current = function() {
  var user = Meteor.user();
  return user ? I18N.Languages[user.lang()] : undefined;
};

if (Meteor.isClient) {
  Meteor.startup(function () {
    Tracker.autorun(function () {
      var lang = currentLanguage();
      if (lang) {
        TAPi18n.setLanguage(lang.code);
      }
    });
  });
}

if (Meteor.isClient) {
  Template.I18N$SelectLanguage.helpers({
    languages: I18N.Languages,
    currentLanguage: currentLanguage
  });
  Template.I18N$SelectLanguage.onRendered(function () {
    var $ = this.$.bind(this);
    $(".dropdown-button").assertSizeAtLeast(1).dropdown();
  });
  Template.I18N$flag.events( {
    'click li': function () {
      Meteor.user().lang( this.code );
    }
  });
}

/* Date format (mostly moment, but not only)
 * moment.js for the four supported languages are automagically
 * loaded by the corresponding rzymek:moment-locale-XX package
 * Authoritative info here: https://en.wikipedia.org/wiki/Date_format_by_country
 */

import mapKeys from 'lodash/mapKeys';

if (Meteor.isClient) {
  Tracker.autorun(function () {
    moment.locale(TAPi18n.getLanguage());
  });
}

// Swiss-style dates for the "fr" locale
var frenchDates = moment.localeData("fr")._longDateFormat;
mapKeys(frenchDates, function(v, k) {
  frenchDates[k] = v.replace(/[/-]/g, ".");
});

/**
 * The date format for this Language, in moment.js notation.
 * Intended to be called by non-moment date-aware code (e.g. DatePicker in Widget$Date)
 * @returns {String} "DD.MM.YYYY" or "MM/DD/YYYY" etc.
 */
I18N.Language.prototype.momentDateFormat = function (code) {
  var longDateFormat = moment.localeData(this.code)._longDateFormat;
  return longDateFormat[code] || longDateFormat[code.toUpperCase()];
};
