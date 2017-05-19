/*! chaas - v0.2.0 - 2017-05-19
* https://github.com/behappyrightnow/chaas
 Licensed  */
// (function(){
angular.module('chaas', ['ngRoute']).config([
    '$routeProvider', function ($routeProvider) {
        $routeProvider.when('/:page', {
            controller: 'FitController',
            controllerAs: 'fit',
            templateUrl: '/app/views/page.html'
        }).otherwise({ redirectTo: '/HomePage' });
    }]);
// })();

// <reference path="../app.ts">
// (function(){
var FitController = (function () {
    function FitController($http, $routeParams, CONFIG) {
        var _this = this;
        CONFIG.then(function () {
            _this.config = CONFIG;

            _this.loadData($http, $routeParams.page);
        });

        this.editMode = false;
        this.rawText = "";
        this.$http = $http;
    }
    FitController.prototype.loadData = function ($http, page) {
        this.pageTitle = page;
        var that = this;
        console.log("Loading data from " + this.config.path(this.config.wiki, page));
        $http({ method: 'GET', url: this.config.path(this.config.wiki, page) }).success(function (data, status, headers, config) {
            that.rawText = data;
            var lines = data.split("\n");
            that.pageContents = fitUtils.wikiData(lines, $http);
        }).error(function (data, status, headers, config) {
            console.log("error!");
        });
    };
    FitController.prototype.runFitTestsOnPage = function () {
        var _this = this;
        console.log("Running fit tests");
        var tables = _.filter(this.pageContents, function (element) {
            return element.type === 'TABLE';
        });
        _.each(tables, function (table) {
            _this.process(table);
        });
    };

    FitController.prototype.process = function (tableEl) {
        var processor = this.createProcessor(tableEl.firstRow());
        processor.process(tableEl);
    };

    FitController.prototype.createProcessor = function (firstRow) {
        if (firstRow.length === 1) {
            return new DecisionProcessor(fitUtils);
        } else {
            var firstCell = firstRow[0].cellEntry.toUpperCase();
            if (firstCell.indexOf("QUERY") !== -1) {
                return new QueryProcessor(fitUtils);
            } else if (firstCell.indexOf("SCRIPT") !== -1) {
                return new ScriptProcessor(fitUtils);
            } else {
                throw "Could not understand which Processor needs to be instantiated!";
            }
        }
    };

    FitController.prototype.editPage = function () {
        this.editMode = true;
    };

    FitController.prototype.savePage = function () {
        var lines = this.rawText.split("\n");
        this.pageContents = fitUtils.wikiData(lines, this.$http);
        this.editMode = false;
        console.log(this.pageTitle);
        console.log(this.rawText);
        var that = this;
        var data = { name: this.pageTitle, contents: this.rawText };
        jQuery.post("/page", data).done(function (data) {
            console.log("Done posting data");
        });
        /*this.$http({method:"POST",url:"/page",data:data}
        ).
        success(function(data, status, headers, config) {
        console.log("Saved successfully");
        }).
        error(function(data, status, headers, config) {
        console.log("Error! Could not save "+that.rawText);
        });*/
    };

    FitController.prototype.pasteContent = function (event) {
        var pasteProcessor = new PasteProcessor(event);
        pasteProcessor.process();
        if (pasteProcessor.rows !== undefined && pasteProcessor.rows.length > 0) {
            this.rawText += "\n";
        }
        for (var i = 0; i < pasteProcessor.rows.length; i++) {
            var row = pasteProcessor.rows[i];
            var line = "|";
            for (var j = 0; j < row.length && row[j] !== ""; j++) {
                line += row[j];
                if (j >= 0 && j < row.length) {
                    line += "|";
                }
            }
            this.rawText += line + "\n";
        }
        this.savePage();
        console.log("Pasted ", pasteProcessor.rows);
    };
    return FitController;
})();

angular.module('chaas').controller('FitController', FitController);
// })();

(function () {
    angular.module('chaas').directive('chaasFixture', function chaasFixtureDirective() {
        return {
            restrict: 'E',
            controller: [
                'CONFIG', '$http', '$element', '$scope', function chaasFixtureLink(CONFIG, $http, $element, $scope) {
                    $scope.processListing = function (listing, path) {
                        _.each(listing.split('\n'), function (basename) {
                            if (!/.js$/.test(basename))
                                return;
                            $element.append($('<script>', {
                                type: 'text/javascript',
                                src: path + basename
                            }));
                        }); // END _.each
                    };
                    CONFIG.then(function () {
                        var allPaths = new Array();
                        debugger;
                        allPaths = CONFIG.logic.concat(CONFIG.fixtures);
                        for (var i = 0; i < allPaths.length; i++) {
                            var path = allPaths[i];
                            (function (path) {
                                $http.get(path).success(function (listing) {
                                    $scope.processListing(listing, path);
                                });
                            })(path);
                        }
                    }); // END CONFIG.then()
                }]
        };
    });
})();

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="scripts/FitUtils.ts"/>
var Processor = (function () {
    function Processor(fitUtils) {
        this.fitUtils = fitUtils;
    }
    Processor.prototype.initializeClass = function (classToInit, classCell) {
        var objectUnderTest = undefined;
        try  {
            var objectUnderTest = new window[classToInit]();
            classCell.status = "PASSED";
        } catch (e) {
            if (objectUnderTest === undefined) {
                //var msg =
                classCell.status = "FAILED";
                classCell.msg = "Class '" + classToInit + "' not found. Please include src file '" + classToInit + ".js' and make sure it contains a class called " + classToInit + ".";
            } else {
                classCell.status = "PASSED";
            }
        }
        return objectUnderTest;
    };
    Processor.prototype.process = function (tableEl) {
        throw "Can't call Processor directly. Please extend in subclass.";
    };
    return Processor;
})();

var DecisionProcessor = (function (_super) {
    __extends(DecisionProcessor, _super);
    function DecisionProcessor() {
        _super.apply(this, arguments);
    }
    DecisionProcessor.prototype.process = function (tableEl) {
        var firstRow = tableEl.firstRow();
        var classToInit = this.fitUtils.camelCaseClass(firstRow[0].cellEntry);
        var objectUnderTest = this.initializeClass(classToInit, firstRow[0]);
        this.processTable(tableEl, objectUnderTest, classToInit);
    };

    DecisionProcessor.prototype.processTable = function (tableEl, objectUnderTest, classToInit) {
        var methods = this.processMethods(tableEl, objectUnderTest, classToInit);
        this.processRows(tableEl, methods, objectUnderTest);
    };

    DecisionProcessor.prototype.processMethods = function (tableEl, objectUnderTest, classToInit) {
        var headerRow = tableEl.rows[1];
        var methods = new Array();
        for (var j = 0; j < headerRow.length; j++) {
            var cell = headerRow[j];
            var methodString = cell.cellEntry;
            var method;
            if (!this.hasQuestionMark(methodString)) {
                method = this.createInputMethod(methodString);
            } else {
                method = this.createOutputMethod(methodString);
            }
            methods.push(method);
            if (objectUnderTest[method.methodName] === undefined) {
                cell.status = "FAILED";
                cell.msg = classToInit + ": No method called '" + method.methodName + "'. Either initialize in constructor or provide a function with this name.";
            } else {
                cell.status = "PASSED";
            }
        }
        return methods;
    };

    DecisionProcessor.prototype.processRows = function (tableEl, methods, objectUnderTest) {
        for (var i = 2; i < tableEl.rows.length; i++) {
            var row = tableEl.rows[i];
            for (var j = 0; j < row.length; j++) {
                var cell = row[j];
                var method = methods[j];
                if (method.isInput) {
                    method.passInput(objectUnderTest, cell.cellEntry);
                }
            }
            if (objectUnderTest["execute"] !== undefined && typeof objectUnderTest["execute"] === "function") {
                objectUnderTest["execute"]();
            }
            for (var j = 0; j < row.length; j++) {
                var cell = row[j];
                var method = methods[j];
                if (!method.isInput) {
                    var retVal = method.fetchOutput(objectUnderTest);
                    if (retVal == cell.cellEntry) {
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
    };

    DecisionProcessor.prototype.hasQuestionMark = function (methodString) {
        return methodString.indexOf('?') !== -1;
    };

    DecisionProcessor.prototype.createInputMethod = function (methodString) {
        return new Method(methodString, true);
    };

    DecisionProcessor.prototype.createOutputMethod = function (methodString) {
        methodString = methodString.substr(0, methodString.length - 1);
        var method = new Method(methodString, false);
        return method;
    };
    return DecisionProcessor;
})(Processor);

var QueryProcessor = (function (_super) {
    __extends(QueryProcessor, _super);
    function QueryProcessor() {
        _super.apply(this, arguments);
    }
    QueryProcessor.prototype.process = function (tableEl) {
        var firstRow = tableEl.firstRow();
        var classToInit = firstRow[0].cellEntry;
        var colonIndex = classToInit.indexOf(":");
        classToInit = classToInit.substr(colonIndex + 1);
        classToInit = this.fitUtils.camelCaseClass(classToInit);
        var objectUnderTest = this.initializeClass(classToInit, firstRow[0]);
        this.checkQueryMethodIn(objectUnderTest, firstRow, classToInit);
        var results = this.callQueryMethod(objectUnderTest, firstRow);
        var fieldHeaders = this.processFieldHeadersIn(tableEl);
        this.processRows(tableEl, fieldHeaders, results);
    };

    QueryProcessor.prototype.checkQueryMethodIn = function (objectUnderTest, firstRow, classToInit) {
        var cell = firstRow[1];
        if (objectUnderTest["query"] === undefined) {
            cell.status = "FAILED";
            cell.msg = "Method query() not found in class " + classToInit;
        } else {
            cell.status = "PASSED";
        }
    };

    QueryProcessor.prototype.callQueryMethod = function (objectUnderTest, firstRow) {
        var queryParameter = firstRow[1].cellEntry;
        return objectUnderTest["query"](queryParameter);
    };

    QueryProcessor.prototype.processFieldHeadersIn = function (tableEl) {
        return _.pluck(tableEl.rows[1], 'cellEntry');
    };

    QueryProcessor.prototype.matchedRow = function (resultRow, fieldHeaders, tableEl) {
        var highestMatchCount = 0;
        var matchedRow = -1;
        for (var rowIndex = 2; rowIndex < tableEl.rows.length; rowIndex++) {
            var row = tableEl.rows[rowIndex];
            var matchCount = 0;
            for (var colIndex = 0; colIndex < fieldHeaders.length; colIndex++) {
                var actual = resultRow[fieldHeaders[colIndex]];
                var expected = row[colIndex].cellEntry;
                if (actual == expected) {
                    matchCount++;
                    if (matchCount > highestMatchCount) {
                        highestMatchCount = matchCount;
                        matchedRow = rowIndex;
                    }
                }
            }
        }
        return matchedRow;
    };

    QueryProcessor.prototype.processRows = function (tableEl, fieldHeaders, results) {
        var surplus = this.matchResultsToTableAndReturnSurplus(results, fieldHeaders, tableEl);
        for (var i = 2; i < tableEl.rows.length; i++) {
            var row = tableEl.rows[i];
            this.processRow(row, results, fieldHeaders);
        }
        this.processSurplusRows(surplus, results, fieldHeaders, tableEl);
    };

    QueryProcessor.prototype.processSurplusRows = function (surplus, results, fieldHeaders, tableEl) {
        for (var i = 0; i < surplus.length; i++) {
            var surplusRow = results[surplus[i]];
            this.processSurplusRow(fieldHeaders, surplusRow, tableEl);
        }
    };

    QueryProcessor.prototype.processSurplusRow = function (fieldHeaders, surplusRow, tableEl) {
        var tableRow = new Array();
        for (var j = 0; j < fieldHeaders.length; j++) {
            var cellEntry = surplusRow[fieldHeaders[j]];
            tableRow.push(new CellWikiElement(cellEntry));
        }
        tableRow[0].status = "IGNORED";
        tableRow[0].msg = "surplus";
        tableEl.rows.push(tableRow);
    };

    QueryProcessor.prototype.processRow = function (row, results, fieldHeaders) {
        var matchedIndex = row[0].foundIndex;
        if (matchedIndex !== undefined) {
            var actualRow = results[matchedIndex];
            for (var j = 0; j < fieldHeaders.length; j++) {
                if (row[j].cellEntry === '') {
                    row[j].status = "IGNORED";
                    row[j].actual = actualRow[fieldHeaders[j]];
                    continue;
                }
                if (row[j].cellEntry === actualRow[fieldHeaders[j]]) {
                    row[j].status = "PASSED";
                } else {
                    row[j].status = "FAILED";
                    row[j].expected = row[j].cellEntry;
                    row[j].actual = actualRow[fieldHeaders[j]];
                }
            }
        } else {
            row[0].status = "FAILED";
            row[0].msg = "missing";
        }
    };

    QueryProcessor.prototype.matchResultsToTableAndReturnSurplus = function (results, fieldHeaders, tableEl) {
        var surplus = new Array();
        for (var i = 0; i < results.length; i++) {
            var resultRow = results[i];
            var matchedRow = this.matchedRow(resultRow, fieldHeaders, tableEl);
            if (matchedRow !== -1) {
                tableEl.rows[matchedRow][0].foundIndex = i;
            } else {
                surplus.push(i);
            }
        }
        return surplus;
    };
    return QueryProcessor;
})(Processor);

function applyConstruct(ctor, params) {
    var obj, newobj;

    // Create the object with the desired prototype
    if (typeof Object.create === "function") {
        // ECMAScript 5
        obj = Object.create(ctor.prototype);
    } else if ({}.__proto__) {
        // Non-standard __proto__, supported by some browsers
        obj = {};
        obj.__proto__ = ctor.prototype;
        if (obj.__proto__ !== ctor.prototype) {
            // Setting it didn't work
            obj = makeObjectWithFakeCtor();
        }
    } else {
        // Fallback
        obj = makeObjectWithFakeCtor();
    }

    // Set the object's constructor
    obj.constructor = ctor;

    // Apply the constructor function
    newobj = ctor.apply(obj, params);

    // If a constructor function returns an object, that
    // becomes the return value of `new`, so we handle
    // that here.
    if (typeof newobj === "object") {
        obj = newobj;
    }

    // Done!
    return obj;

    // Subroutine for building objects with specific prototypes
    function makeObjectWithFakeCtor() {
        function fakeCtor() {
        }
        fakeCtor.prototype = ctor.prototype;
        return new fakeCtor();
    }
}
var ScriptProcessor = (function (_super) {
    __extends(ScriptProcessor, _super);
    function ScriptProcessor() {
        _super.apply(this, arguments);
    }
    ScriptProcessor.prototype.process = function (tableEl) {
        var firstRow = tableEl.firstRow();
        var classToInit = firstRow[1].cellEntry;
        classToInit = this.fitUtils.camelCaseClass(classToInit);
        var args = new Array();
        for (var i = 2; i < firstRow.length; i++) {
            args.push(firstRow[i].cellEntry);
        }
        var objectUnderTest = this.callConstructor(classToInit, args, firstRow);

        var reservedWords = ["reject", "check", "note", "check not", "ensure", "show"];
        this.processRows(tableEl, reservedWords, objectUnderTest);
    };

    ScriptProcessor.prototype.callConstructor = function (classToInit, args, firstRow) {
        try  {
            var classType = null;
            if (classToInit.indexOf(".") !== -1) {
                var pieces = classToInit.split(".");
                classType = window[pieces[0]];
                for (var i = 1; i < pieces.length; i++) {
                    classType = classType[pieces[i]];
                }
            } else {
                classType = window[classToInit];
            }
            var objectUnderTest = applyConstruct(classType, args);
            console.log(firstRow, firstRow.length);
            for (var j = 2; j < firstRow.length; j++) {
                firstRow[j].status = "PASSED";
            }
            return objectUnderTest;
        } catch (err) {
            for (var i = 2; i < firstRow.length; i++) {
                firstRow[i].status = "FAILED";
                firstRow[i].msg = "Exception thrown " + err;
            }
        }
    };

    ScriptProcessor.prototype.processRows = function (tableEl, reservedWords, objectUnderTest) {
        var rows = tableEl.rows;
        for (var i = 1; i < rows.length; i++) {
            var row = rows[i];
            this.processRow(row, reservedWords, objectUnderTest);
        }
    };

    ScriptProcessor.prototype.processRow = function (row, reservedWords, objectUnderTest) {
        var methodCell = row[0];
        var methodString = methodCell.cellEntry;
        if (reservedWords.indexOf(methodString) !== -1) {
            methodString = this.fitUtils.camelCase(methodString);
            if (this.isReservedWord(methodString)) {
                this[methodString](objectUnderTest, row);
            } else {
                methodCell.status = "IDLE";
                methodCell.msg = "reserved word: " + methodString;
            }
        } else {
            var results = this.methodFromRow(row);
            this.runRowTest(row[0], results, objectUnderTest, true, false);
        }
        //        return {methodCell: methodCell, methodString: methodString, method: method, argsArray: argsArray};
    };

    ScriptProcessor.prototype.isReservedWord = function (methodString) {
        return this[methodString] !== undefined;
    };

    ScriptProcessor.prototype.runRowTest = function (resultingCell, results, objectUnderTest, valueToCompare, inverse) {
        var argsArray = results.argsArray;
        var method = results.method;

        if (objectUnderTest[method.methodName] !== undefined) {
            var result = null;
            if (typeof objectUnderTest[method.methodName] === "function") {
                result = objectUnderTest[method.methodName].apply(objectUnderTest, argsArray);
            } else {
                result = objectUnderTest[method.methodName];
            }

            var compareResult = inverse ? (result != valueToCompare) : (result == valueToCompare);
            if (compareResult) {
                this.methodPassed(resultingCell, method);
            } else {
                this.methodFailed(resultingCell, method, result);
            }
        } else {
            this.methodDoesNotExist(resultingCell, method);
        }
    };

    ScriptProcessor.prototype.check = function (objectUnderTest, row) {
        var results = this.methodFromRow(row.slice(1, row.length - 1));
        var resultCell = row[row.length - 1];
        this.runRowTest(resultCell, results, objectUnderTest, resultCell.cellEntry, false);
    };

    ScriptProcessor.prototype.checkNot = function (objectUnderTest, row) {
        var results = this.methodFromRow(row.slice(1, row.length - 1));
        var resultCell = row[row.length - 1];
        this.runRowTest(resultCell, results, objectUnderTest, resultCell.cellEntry, true);
    };

    ScriptProcessor.prototype.reject = function (objectUnderTest, row) {
        var results = this.methodFromRow(row.slice(1));
        this.runRowTest(row[0], results, objectUnderTest, false, false);
    };

    ScriptProcessor.prototype.ensure = function (objectUnderTest, row) {
        var results = this.methodFromRow(row.slice(1));
        this.runRowTest(row[0], results, objectUnderTest, true, false);
    };

    ScriptProcessor.prototype.show = function (objectUnderTest, row) {
        var results = this.methodFromRow(row.slice(1));
        var method = results.method;
        var argsArray = results.argsArray;
        if (objectUnderTest[method.methodName] !== undefined) {
            var result = objectUnderTest[method.methodName].apply(objectUnderTest, argsArray);
            var cell = new CellWikiElement(result + "");
            cell.status = "SHOW";
            console.log(result);
            row.push(cell);
        }
    };

    ScriptProcessor.prototype.methodFromRow = function (row) {
        var methodString = row[0].cellEntry;
        var argsArray = [];
        if (methodString[methodString.length - 1] != ";") {
            if (row.length > 1) {
                argsArray.push(row[1].cellEntry);
            }
            for (var j = 2; j < row.length; j += 2) {
                var argCell = row[j + 1];
                var methodCell = row[j];
                argsArray.push(argCell.cellEntry);
                methodString = methodString + " " + methodCell.cellEntry;
            }
        } else {
            for (var j = 1; j < row.length; j++) {
                var argCell = row[j];
                argsArray.push(argCell.cellEntry);
            }
            methodString = methodString.replace(";", "");
        }
        var method = this.createMethod(methodString);
        return { argsArray: argsArray, method: method };
    };

    ScriptProcessor.prototype.methodFailed = function (methodCell, method, result) {
        methodCell.status = "FAILED";
        methodCell.msg = method.methodName + " failed. Got: " + result;
    };

    ScriptProcessor.prototype.methodPassed = function (methodCell, method) {
        methodCell.status = "PASSED";
        methodCell.msg = "found method: " + method.methodName;
    };

    ScriptProcessor.prototype.methodDoesNotExist = function (methodCell, method) {
        methodCell.status = "FAILED";
        methodCell.msg = "couldn't find method: " + method.methodName;
    };

    ScriptProcessor.prototype.createMethod = function (methodString) {
        return new Method(methodString, true);
    };
    return ScriptProcessor;
})(Processor);

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var FitUtils = (function () {
    function FitUtils() {
    }
    FitUtils.prototype.capitalized = function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    };
    FitUtils.prototype.camelCaseClass = function (text) {
        var words = text.split(" ");
        var answer = "";
        for (var i = 0; i < words.length; i++) {
            answer += this.capitalized(words[i]);
        }
        return answer;
    };

    FitUtils.prototype.camelCase = function (text) {
        if (text.indexOf(" ") === -1) {
            return text;
        }
        var words = text.split(" ");
        var answer = words[0];
        for (var i = 1; i < words.length; i++) {
            answer += this.capitalized(words[i]);
        }
        return answer;
    };

    FitUtils.prototype.wikiData = function (lines, $http) {
        var tableFound = false;
        var tableElement;
        var answer = new Array();
        lines.forEach(function (line) {
            if (!tableFound) {
                if (line.charAt(0) === '|') {
                    tableFound = true;
                    tableElement = new TableWikiElement();
                    tableElement.addRow(line);
                } else {
                    answer.push(new DefaultElement(line, $http));
                }
            } else if (tableFound) {
                if (line.charAt(0) !== '|') {
                    tableFound = false;
                    answer.push(tableElement);
                    tableElement = null;
                    answer.push(new DefaultElement(line, $http));
                } else {
                    tableElement.addRow(line);
                }
            }
        });
        if (tableElement !== null && tableElement !== undefined) {
            answer.push(tableElement);
        }
        return answer;
    };
    return FitUtils;
})();

var DefaultElement = (function () {
    function DefaultElement(line, $http) {
        this.contents = new Array();
        this.type = "DEFAULT";
        this.process(line, $http);
    }
    DefaultElement.prototype.process = function (line, $http) {
        var state = new WikiState.MinusOne("", "");
        var accumulation = new Array();
        state.transition(accumulation, line, 0);
        for (var i = 0; i < accumulation.length; i++) {
            this.contents.push(accumulation[i].createAtomicElement($http));
        }
    };
    return DefaultElement;
})();

/**
* See FitUtils_automata.JPG in the execJS folder to understand the finite automata implemented here.
*/
var WikiState;
(function (WikiState) {
    var State = (function () {
        function State(text, oldText) {
            this.text = text;
            this.oldText = oldText;
        }
        State.prototype.transition = function (contents, line, index) {
            var character = line[index];
            if (character === undefined) {
                this.endInputTransition(contents);
                return;
            }
            var state = this.nextState(contents, character);
            if (index < line.length - 1) {
                state.transition(contents, line, index + 1);
            } else {
                state.endInputTransition(contents);
            }
        };
        State.prototype.endInputTransition = function (contents) {
            throw "Can't call directly";
        };
        State.prototype.nextState = function (contents, character) {
            throw "Can't call directly";
        };
        State.prototype.createAtomicElement = function ($http) {
            throw "Can't call directly";
        };
        return State;
    })();
    WikiState.State = State;
    var MinusOne = (function (_super) {
        __extends(MinusOne, _super);
        function MinusOne() {
            _super.apply(this, arguments);
        }
        MinusOne.prototype.nextState = function (contents, character) {
            if (character >= 'A' && character <= 'Z') {
                return new Zero(character, this.text);
            } else {
                return new MinusOne(this.text + character, "");
            }
        };
        MinusOne.prototype.endInputTransition = function (contents) {
            contents.push(this);
        };
        MinusOne.prototype.createAtomicElement = function ($http) {
            if (this.text.toUpperCase().indexOf(".PNG") !== -1) {
                return new ImageElement(this.text);
            } else {
                return new TextElement(this.text);
            }
        };
        return MinusOne;
    })(State);
    WikiState.MinusOne = MinusOne;
    var Zero = (function (_super) {
        __extends(Zero, _super);
        function Zero() {
            _super.apply(this, arguments);
        }
        Zero.prototype.nextState = function (contents, character) {
            if (character >= 'a' && character <= 'z') {
                return new One(this.text + character, this.oldText);
            } else {
                return new MinusOne(this.oldText + this.text + character, "");
            }
        };
        Zero.prototype.endInputTransition = function (contents) {
            contents.push(new MinusOne(this.oldText, ""));
        };
        return Zero;
    })(State);
    WikiState.Zero = Zero;
    var One = (function (_super) {
        __extends(One, _super);
        function One() {
            _super.apply(this, arguments);
        }
        One.prototype.nextState = function (contents, character) {
            if (character >= 'a' && character <= 'z') {
                return new One(this.text + character, this.oldText);
            } else if (character >= 'A' && character <= 'Z') {
                return new Two(this.text + character, this.oldText);
            } else {
                return new MinusOne(this.oldText + this.text + character, "");
            }
        };

        One.prototype.endInputTransition = function (contents) {
            contents.push(new MinusOne(this.oldText, ""));
        };
        return One;
    })(State);
    WikiState.One = One;
    var Two = (function (_super) {
        __extends(Two, _super);
        function Two() {
            _super.apply(this, arguments);
        }
        Two.prototype.nextState = function (contents, character) {
            if ((character >= 'a' && character <= 'z') || (character >= 'A' && character <= 'Z')) {
                return new Two(this.text + character, this.oldText);
            } else {
                contents.push(new MinusOne(this.oldText, ""));
                return new Three(this.text, character);
            }
        };

        Two.prototype.endInputTransition = function (contents) {
            contents.push(new Three(this.text, ""));
        };
        return Two;
    })(State);
    WikiState.Two = Two;
    var Three = (function (_super) {
        __extends(Three, _super);
        function Three() {
            _super.apply(this, arguments);
        }
        Three.prototype.nextState = function (contents, character) {
            contents.push(this);
            return new MinusOne(this.oldText + character, "");
        };

        Three.prototype.endInputTransition = function (contents) {
        };
        Three.prototype.createAtomicElement = function ($http) {
            return new LinkElement(this.text, $http);
        };
        return Three;
    })(State);
    WikiState.Three = Three;
})(WikiState || (WikiState = {}));

var TextElement = (function () {
    function TextElement(text) {
        this.text = text;
        this.type = "TEXT";
    }
    return TextElement;
})();
var ImageElement = (function () {
    function ImageElement(text) {
        this.url = text;
        this.type = "IMAGE";
    }
    return ImageElement;
})();
var LinkElement = (function () {
    function LinkElement(text, $http) {
        this.text = text;

        this.type = "LINK";
        var that = this;
    }
    LinkElement.prototype.url = function () {
        return '#/' + this.text;
    };
    return LinkElement;
})();

var TableWikiElement = (function () {
    function TableWikiElement() {
        this.type = "TABLE";
        this.rows = new Array();
        this.maxCols = 1;
    }
    TableWikiElement.prototype.addRow = function (row) {
        var cells = this.parseCells(row);
        var cellElements = new Array();
        _.each(cells, function (cell) {
            cellElements.push(new CellWikiElement(cell));
        });
        this.rows.push(cellElements);
        if (cells.length > this.maxCols) {
            this.maxCols = cells.length;
        }
    };

    TableWikiElement.prototype.firstRow = function () {
        return this.rows[0];
    };

    TableWikiElement.prototype.parseCells = function (row) {
        var tempLine = row.substr(1);
        var lastSlashLoc = tempLine.lastIndexOf("|");
        tempLine = tempLine.substr(0, lastSlashLoc);
        return tempLine.split("|");
    };
    return TableWikiElement;
})();

var CellWikiElement = (function () {
    function CellWikiElement(cellEntry) {
        this.cellEntry = cellEntry;
        this.status = "IDLE";
        this.msg = null;
        this.expected = null;
        this.actual = null;
    }
    return CellWikiElement;
})();
var fitUtils = new FitUtils();

var Method = (function () {
    function Method(methodString, isInput) {
        this.methodName = fitUtils.camelCase(methodString);
        this.isInput = isInput;
    }
    Method.prototype.passInput = function (objectUnderTest, data) {
        if (objectUnderTest[this.methodName] === undefined || typeof objectUnderTest[this.methodName] !== 'function') {
            objectUnderTest[this.methodName] = data;
        } else {
            objectUnderTest[this.methodName](data);
        }
    };

    Method.prototype.fetchOutput = function (objectUnderTest) {
        var retVal;
        if (objectUnderTest[this.methodName] === undefined || typeof objectUnderTest[this.methodName] !== 'function') {
            if (objectUnderTest[this.methodName] !== undefined) {
                retVal = objectUnderTest[this.methodName];
            }
        } else {
            retVal = objectUnderTest[this.methodName]();
        }

        return retVal;
    };
    return Method;
})();

var PasteProcessor = (function () {
    function PasteProcessor(event) {
        this.data = this.dataFrom(event);
    }
    PasteProcessor.prototype.process = function () {
        this.rows = new Array();
        this.extractRowsFrom(this.data);
    };

    PasteProcessor.prototype.dataFrom = function (event) {
        var data;
        if (event.clipboardData && event.clipboardData.getData) {
            data = event.clipboardData.getData('text/plain');
        } else if (event.originalEvent && event.originalEvent.clipboardData && event.originalEvent.clipboardData.getData) {
            data = event.originalEvent.clipboardData.getData('text/plain');
        } else if (window.clipboardData) {
            data = window.clipboardData.getData("Text");
        }
        return data;
    };

    PasteProcessor.prototype.extractRowsFrom = function (pastedData) {
        var lines = pastedData.split("\n");
        lines = this.processForMacChrome(lines);
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var cells = line.split("\t");
            for (var j = 0; j < cells.length; j++) {
                cells[j] = cells[j].trim();
            }
            this.rows.push(cells);
        }
    };

    PasteProcessor.prototype.processForMacChrome = function (lines) {
        var answer = lines;
        if (lines.length == 1) {
            lines = lines[0].split("\r");
            answer = lines;
        }
        return answer;
    };
    return PasteProcessor;
})();

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var StandaloneController = (function (_super) {
    __extends(StandaloneController, _super);
    function StandaloneController() {
        _super.apply(this, arguments);
    }
    StandaloneController.prototype.loadData = function ($http) {
        this.pageContents = fitUtils.wikiData([
            "This will map to a class called ShouldIBuyChaas. Each row in the table is a test.",
            "",
            "|should I buy chaas|",
            "|cash in wallet|credit card|pints of chaas remaining|go to store?|",
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
            "|5123122|||||",
            "",
            "Now, let's see a script table.",
            "|script|login dialog driver|Bob|xyzzy|",
            "|login with username|Bob|and password|xyzzy|",
            "|login with username and password;|Bob|xyzzy|",
            "|check|login message|Bob logged in.|",
            "|reject|login with username|Bob|and password|bad password|",
            "|check|login message|Bob not logged in.|",
            "|check not|login message|Bob logged in.|",
            "|ensure|login with username|Bob|and password|xyzzy|",
            "|note|this is a comment|",
            "|show|number of login attempts|"
        ], mockHttp);
    };
    return StandaloneController;
})(FitController);
angular.module('fitApp').controller('StandaloneController', StandaloneController);

function mockHttp(someData) {
    return {
        success: function (fn) {
            return mockHttp(someData);
        },
        error: function (fn) {
            return mockHttp(someData);
        }
    };
}

(function () {
    angular.module('chaas').factory('CONFIG', [
        '$q', '$http', function ($q, $http) {
            var deferred = $q.defer();

            $http.get('/chaas.json').success(function (data) {
                angular.extend(deferred.promise, data);

                deferred.resolve();
            });

            return angular.extend(deferred.promise, {
                path: function () {
                    return _.reduce(arguments, function (memo, part) {
                        return memo.replace(/\/$/, '') + '/' + part;
                    });
                }
            });
        }]);
})();
