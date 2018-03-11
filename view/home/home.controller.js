(function() {

  angular
    .module('starterApp')
    .controller('homeCtrl', homeCtrl);

    function homeCtrl () {
      console.log('Home controller is running');
    }

})();