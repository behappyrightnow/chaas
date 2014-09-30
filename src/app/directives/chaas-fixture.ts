(function(){
  angular.module('chaas')
    .directive('chaasFixture', function chaasFixtureDirective(){
      return {
        restrict: 'E',
        controller: [ 'CONFIG', '$http', '$element', '$scope', function chaasFixtureLink(CONFIG, $http, $element, $scope){
          $scope.processListing = function(listing, path) {
            _.each(listing.split('\n'), function(basename){
                if ( ! /.js$/.test(basename) ) return;
                $element.append($('<script>', {
                  type: 'text/javascript',
                  src: path + basename
                }));
              }); // END _.each
          };
          CONFIG.then(function(){
            var allPaths: Array<string> = new Array();
            allPaths = CONFIG.fixtures.concat(CONFIG.logic);
            for (var i=0;i<allPaths.length;i++) {
                var path = allPaths[i];
                $http.get(path).success((listing)=>{
                    $scope.processListing(listing, path);
                }); // END $http.get(path)
            }
          }); // END CONFIG.then()
        } ],
      };
    }) // END chaasFixture
})();
