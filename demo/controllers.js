angular.module('ionic-alpha-scroll-demo', ['ion-alpha-scroll']).controller('IonAlphaScrollCtrl', function ($scope) {
  var getContacts = function () {
    var str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var result = [];
    for (var i = 0; i < str.length; i++) {
      var nextChar = str.charAt(i);
      for (var j = 0; j < 5; j++) {
        var name = nextChar + 'name' + j;
        result.push({
          name: name,
          description: 'My name is ' + name
        });
      }
    }
    return result;
  };

  $scope.doRefresh = function () {
    $scope.contacts = getContacts();
    $scope.$broadcast('scroll.refreshComplete');
  };

  $scope.doRefresh();
});
