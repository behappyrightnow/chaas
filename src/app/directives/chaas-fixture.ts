(function(){
  angular.module('fitWiki')
    .directive('chaasFixture', function chaasFixtureDirective(){
      return {
        restrict: 'E',
        controller: [ 'CONFIG', '$http', '$element', function chaasFixtureLink(CONFIG, $http, $element){
          debugger;
          CONFIG.then(function(){
            debugger;
            var path = CONFIG.fixtures[0]; // FIXME: We have more than 1 fixture!

            $http.get(path).success((listing)=>{
              debugger;

              // FIXME: This should be JSON, not a string...
              _.each(listing.split('\n'), function(basename){
                if ( ! /.js$/.test(basename) ) return;

                $element.append($('<script>', {
                  type: 'text/javascript',
                  src: path + basename
                }));
              }); // END _.each
            }); // END $http.get(path)
          }); // END CONFIG.then()
        } ],
      };
    }) // END chaasFixture
})();
