/**
 * Extensions to manuel:viewmodel
 */

ViewModel.prototype.childrenByTag = function() {
   var result = {};
   _.each(this.children(), function (child) {
       if (child.vmTag) {
           result[child.vmTag()] = child;
       }
   });
    return result;
};