// <reference path="../app.ts">
// (function(){
    class FitController {
        config:any;
        pageContents:Array<WikiElement>;
        pageTitle: string;
        editMode: boolean;
        rawText: string;
        $http: any;
        constructor($http, $routeParams, CONFIG){
            this.loadData($http, $routeParams.page);
            this.editMode = false;
            this.rawText = "";
            this.$http = $http;
        }

        loadData($http, page) {
            console.log(page);
            this.pageTitle = page;
             var that = this;
             $http({method: 'GET', url: '/stories/' + page }).
                success(function(data, status, headers, config) {
                     that.rawText = data;
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

        editPage() {
            this.editMode = true;
        }

        savePage() {
            var lines = this.rawText.split("\n");
            this.pageContents = fitUtils.wikiData(lines, this.$http);
            this.editMode = false;
        }
    } // END FitController

    angular.module('fitWiki')
        .controller('FitController', FitController);

// })();
