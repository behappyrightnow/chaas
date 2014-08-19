// <reference path="../app.ts">
// (function(){
    angular.module('fitWiki')
        .controller('FitController', FitController);

    class FitController {
        pageContents:Array<WikiElement>;

        constructor($http){
           this.loadData($http);
        }
        loadData($http) {
             var that = this;
             $http({method: 'GET', url: '/stories/HomePage'}).
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
            var tables = _.filter(this.pageContents, function(element) { return element.type === 'TABLE';});
            _.each(tables, (table:TableWikiElement) => {this.process(table)});
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
// })();
