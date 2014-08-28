(function(){
  angular.module('fitWiki')
    .factory('CONFIG', [ '$q', '$http', function($q, $http){
      var deferred = $q.defer();

      debugger;

      $http.get('/chaas.json').success((data)=>{
        angular.extend(deferred.promise, data);

        deferred.resolve();
      });

      return deferred.promise;
    } ]);
})();
