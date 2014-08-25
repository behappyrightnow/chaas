// <reference path="../app.ts">
// (function(){
    class FitController {
        config:any;
        pageContents:Array<WikiElement>;

        constructor($http, $routeParams){
           this.loadData($http, $routeParams.page);

           this.loadConfig($http).then(()=>{
               this.loadFixtures($http);
           })
        }

        loadConfig($http){
            return $http.get('/chaas.json').success((data)=>{
                this.config = data;
                console.log(this.config);
            });
        }

        loadFixtures($http){
            return $http.get(this.config.fixtures[0]).success((listing)=>{
                listing = listing.split('\n'); // FIXME: This should be JSON, not a string...
                this.fixtures  = _.filter(listing, function(filename){
                    return /.js$/.test(filename);
                })
            });
        }

        fixture(filename){
            return this.config.fixtures[0] + '/' + filename;
        }

        loadData($http, page) {
            console.log(page);
             var that = this;
             $http({method: 'GET', url: '/stories/' + page }).
                success(function(data, status, headers, config) {
                     var lines = data.split("\n");
                     that.pageContents = fitUtils.wikiData(lines, $http);
                }).
                error(function(data, status, headers, config) {
                  console.log("error!");
                });
        }
        runFitTestsOnPage() {
            console.log("Running fit tests");
            var tables = _.filter(this.pageContents, function(element) {
                return element.type === 'TABLE';
            });
            _.each(tables, (table:TableWikiElement) => { this.process(table) });
        }

        process(tableEl:TableWikiElement) {
            var processor:Processor = this.createProcessor(tableEl.firstRow());
            processor.process(tableEl);
        }

        createProcessor(firstRow:any):Processor {
            if (firstRow.length === 1) {
                return new DecisionProcessor(fitUtils);
            } else {
                var firstCell:string = firstRow[0].cellEntry.toUpperCase();
                if (firstCell.indexOf("QUERY") !== -1) {
                    return new QueryProcessor(fitUtils);
                } else if (firstCell.indexOf("SCRIPT") !== -1) {
                    return new ScriptProcessor(fitUtils);
                } else {
                    throw "Could not understand which Processor needs to be instantiated!";
                }
            }
        }
    } // END FitController

    angular.module('fitWiki')
        .controller('FitController', FitController);

// })();
