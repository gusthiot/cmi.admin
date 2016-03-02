/**
 * Turn templates into components, sans the overhead of meteor-blaze-components
 */

if (Meteor.isClient) {
  /**
   * Optionally add an ID to a templated DOM element.
   *
   * If the template we're in was passed an id= argument, return it as a
   * map-of-attributes with a single item; otherwise do nothing (return an empty
   * map).
   *
   * Usage:   <div-or-whatever {{addID}}>   ... </div-or-whatever>
   */
  Template.registerHelper("addID", function() {
    var context = Template.currentData();
    if (context && context.id) {
      return { id: context.id};
    } else {
      return {};
    }
  });
}
