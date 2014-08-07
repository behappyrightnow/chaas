/// <reference path="FitUtils.ts"/>
/// <reference path="FitProcessors.ts"/>
angular.module('fitApp',[])
  .controller('fitController', function ($scope) {
        $scope.pageContents = fitUtils.wikiData([
            "This will map to a class called ShouldIBuyMilk. Each row in the table is a test.",
            "",
            "|should I buy milk|",
            "|cash in wallet|credit card|pints of milk remaining|go to store?|",
            "|0|no|0|no|",
            "|10|no|0|yes|",
            "|0|yes|0|yes|",
            "|10|yes|0|yes|",
            "|0|no|1|no|",
            "|10|no|1|no|",
            "|0|yes|1|no|",
            "|10|yes|1|no|",
            "",
            "This is an example of executable documentation!",
            "Now let's try a Query table",
            "|Query:employees hired before|10-Dec-1980|",
            "|company number|employee number|first name|last name|hire date|",
            "|4808147|9942|Bill|Mitchell|19-Dec-1966|",
            "|4808147|1429|Bob|Mastin|10-Oct-1975|",
            "|5123122|||||"
        ])

        $scope.runFitTestsOnPage = function() {
            console.log("Running fit tests");
            for (var i=0;i<$scope.pageContents.length;i++) {
                var wikiElement: WikiElement = $scope.pageContents[i];
                if (wikiElement.type === 'TABLE') {
                    $scope.process(wikiElement);
                }
            }
        }

        $scope.process = function(tableEl:TableWikiElement) {
            var processor:Processor = createProcessor(tableEl.firstRow());
            processor.process(tableEl);
        }

        function createProcessor(firstRow:any):Processor {
            if (firstRow.length === 1) {
                return new DecisionProcessor(fitUtils);
            } else {
                return new QueryProcessor(fitUtils);
            }
        }
  });