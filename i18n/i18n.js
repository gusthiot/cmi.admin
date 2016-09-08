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
    var $ = this.$.bind(this);
    $(".dropdown-button").assertSizeAtLeast(1).dropdown();
  });
  Template.I18N$flag.events( {
    'click li': function () {
      Meteor.user().lang( this.code );
    }
  });
}

/* Moment i18n */
if (Meteor.isClient) {
  moment.locale('fr', {
    months: "janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_"),
    monthsShort: "janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.".split("_"),
    weekdays: "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
    weekdaysShort: "dim._lun._mar._mer._jeu._ven._sam.".split("_"),
    weekdaysMin: "Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),
    longDateFormat: {
      LT: "HH:mm",
      LTS: "HH:mm:ss",
      L: "DD/MM/YYYY",
      LL: "D MMMM YYYY",
      LLL: "D MMMM YYYY LT",
      LLLL: "dddd D MMMM YYYY LT"
    },
    calendar: {
      sameDay: "[Aujourd'hui à] LT",
      nextDay: '[Demain à] LT',
      nextWeek: 'dddd [à] LT',
      lastDay: '[Hier à] LT',
      lastWeek: 'dddd [dernier à] LT',
      sameElse: 'L'
    },
    relativeTime: {
      future: "dans %s",
      past: "il y a %s",
      s: "quelques secondes",
      m: "une minute",
      mm: "%d minutes",
      h: "une heure",
      hh: "%d heures",
      d: "un jour",
      dd: "%d jours",
      M: "un mois",
      MM: "%d mois",
      y: "une année",
      yy: "%d années"
    },
    ordinalParse: /\d{1,2}(er|ème)/,
    ordinal: function (number) {
      return number + (number === 1 ? 'er' : 'ème');
    },
    meridiemParse: /PD|MD/,
    isPM: function (input) {
      return input.charAt(0) === 'M';
    },
    // in case the meridiem units are not separated around 12, then implement
    // this function (look at locale/id.js for an example)
    // meridiemHour : function (hour, meridiem) {
    //     return /* 0-23 hour, given meridiem token and hour 1-12 */
    // },
    meridiem: function (hours, minutes, isLower) {
      return hours < 12 ? 'PD' : 'MD';
    },
    week: {
      dow: 1, // Monday is the first day of the week.
      doy: 4  // The week that contains Jan 4th is the first week of the year.
    }
  });


  Tracker.autorun(function () {
    moment.locale(TAPi18n.getLanguage());
  });
}