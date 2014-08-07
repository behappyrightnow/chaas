/// <reference path="FitUtils.ts"/>
angular.module('fitApp',[])
  .controller('fitController', function ($scope) {
        $scope.runComplete = false;
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
            "This is an example of executable documentation!"
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
        function hasQuestionMark(methodString) {
            return methodString.indexOf('?') !== -1;
        }

        function createInputMethod(methodString) {
            return new Method(methodString, true);
        }

        function createOutputMethod(methodString) {
            methodString = methodString.substr(0, methodString.length - 1);
            method = new Method(methodString, false);
            return method;
        }

        function processMethods(tableEl, myObject, classToInit) {
            var headerRow = tableEl.rows[1];
            var methods = new Array<Method>();
            for (var j = 0; j < headerRow.length; j++) {
                var cell = headerRow[j];
                var methodString = cell.cellEntry;
                var method: Method;
                if (!hasQuestionMark(methodString)) {
                    method = createInputMethod(methodString);
                } else {
                    method = createOutputMethod(methodString);
                }
                methods.push(method);
                if (myObject.prototype[method.methodName] === undefined) {
                    cell.status = "FAILED";
                    cell.msg = "Method " + method.methodName + "() not found in class " + classToInit;
                } else {
                    cell.status = "PASSED";
                }
            }
            return methods;
        }

        function processRows(tableEl, methods, myObject) {
            for (var i = 2; i < tableEl.rows.length; i++) {
                var row = tableEl.rows[i];
                for (var j = 0; j < row.length; j++) {
                    var cell:CellWikiElement = row[j];
                    var method:Method = methods[j];
                    if (method.isInput) {
                        myObject.prototype[method.methodName](cell.cellEntry);
                    }
                }

                for (var j = 0; j < row.length; j++) {
                    var cell: CellWikiElement = row[j];
                    var method:Method = methods[j];
                    if (!method.isInput) {
                        var retVal = myObject.prototype[method.methodName]();
                        if (retVal === cell.cellEntry) {
                            cell.status = "PASSED";
                        } else {
                            cell.status = "FAILED";
                            cell.msg = null;
                            cell.expected = cell.cellEntry;
                            cell.actual = retVal;
                        }
                    }
                }
            }
        }

        function processTable(tableEl, myObject, classToInit) {
            var methods = processMethods(tableEl, myObject, classToInit);
            processRows(tableEl, methods, myObject);
        }

        $scope.process = function(tableEl:TableWikiElement) {
            $scope.runComplete = false;
            var firstRow: Array<CellWikiElement> = tableEl.rows[0];
            var classToInit = fitUtils.camelCaseClass(firstRow[0].cellEntry);
            var myObject = window[classToInit];
            if (myObject === undefined) {
                //var msg =
                firstRow[0].status = "FAILED";
                firstRow[0].msg = "Class '" + classToInit + "' not found. Please include src file '" + classToInit + ".js' and make sure it contains a class called " + classToInit + ".";
            } else {
                firstRow[0].status = "PASSED";
            }
            processTable(tableEl, myObject, classToInit);
        }
  });