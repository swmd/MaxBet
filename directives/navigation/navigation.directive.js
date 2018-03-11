(function () {

  angular
    .module('starterApp')
    .directive('navigation', navigation);

  function navigation () {
    return {
      restrict: 'EA',
      templateUrl: '/directives/navigation/navigation.view.html',
      controller: 'navigationCtrl as navvm'
    };
  }

})();