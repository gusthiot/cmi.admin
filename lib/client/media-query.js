/**
 * Media queries done right
 */

MediaQuery = function(query) {
    var mediaQueryResult = new ReactiveVar(undefined);
    if (Meteor.isClient) {
        Meteor.startup(function () {
            var q = window.matchMedia(query);
            function updateResult() {
                mediaQueryResult.set(!! q.matches);
            }
            updateResult();
            q.addListener(updateResult);
        });
    }
    return mediaQueryResult;
};
