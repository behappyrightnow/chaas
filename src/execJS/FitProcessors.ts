/// <reference path="FitUtils.ts"/>
class Processor {
    fitUtils: FitUtils;
    constructor(fitUtils: FitUtils) {
        this.fitUtils = fitUtils;
    }
    initializeClass(classToInit, firstRow):any {
        var objectUnderTest = window[classToInit];
        if (objectUnderTest === undefined) {
            //var msg =
            firstRow[0].status = "FAILED";
            firstRow[0].msg = "Class '" + classToInit + "' not found. Please include src file '" + classToInit + ".js' and make sure it contains a class called " + classToInit + ".";
        } else {
            firstRow[0].status = "PASSED";
        }
        return objectUnderTest;
    }
    process(tableEl: TableWikiElement) {
        throw "Can't call Processor directly. Please extend in subclass.";
    }
}
class DecisionProcessor extends Processor {
    process(tableEl: TableWikiElement) {
        var firstRow: Array<CellWikiElement> = tableEl.firstRow();
        var classToInit = this.fitUtils.camelCaseClass(firstRow[0].cellEntry);
        var objectUnderTest = this.initializeClass(classToInit, firstRow);
        this.processTable(tableEl, objectUnderTest, classToInit);
    }

    processTable(tableEl, objectUnderTest, classToInit) {
        var methods = this.processMethods(tableEl, objectUnderTest, classToInit);
        this.processRows(tableEl, methods, objectUnderTest);
    }

    processMethods(tableEl, objectUnderTest, classToInit):Array<Methods> {
        var headerRow = tableEl.rows[1];
        var methods = new Array<Method>();
        for (var j = 0; j < headerRow.length; j++) {
            var cell = headerRow[j];
            var methodString = cell.cellEntry;
            var method: Method;
            if (!this.hasQuestionMark(methodString)) {
                method = this.createInputMethod(methodString);
            } else {
                method = this.createOutputMethod(methodString);
            }
            methods.push(method);
            if (objectUnderTest.prototype[method.methodName] === undefined) {
                cell.status = "FAILED";
                cell.msg = "Method " + method.methodName + "() not found in class " + classToInit;
            } else {
                cell.status = "PASSED";
            }
        }
        return methods;
    }

    processRows(tableEl, methods, objectUnderTest) {
        for (var i = 2; i < tableEl.rows.length; i++) {
            var row = tableEl.rows[i];
            for (var j = 0; j < row.length; j++) {
                var cell:CellWikiElement = row[j];
                var method:Method = methods[j];
                if (method.isInput) {
                    objectUnderTest.prototype[method.methodName](cell.cellEntry);
                }
            }

            for (var j = 0; j < row.length; j++) {
                var cell: CellWikiElement = row[j];
                var method:Method = methods[j];
                if (!method.isInput) {
                    var retVal = objectUnderTest.prototype[method.methodName]();
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

    hasQuestionMark(methodString): boolean {
        return methodString.indexOf('?') !== -1;
    }

    createInputMethod(methodString): Method {
        return new Method(methodString, true);
    }

    createOutputMethod(methodString): Method {
        methodString = methodString.substr(0, methodString.length - 1);
        var method: Method = new Method(methodString, false);
        return method;
    }

}

class QueryProcessor extends Processor {
    process(tableEl: TableWikiElement) {
        var firstRow: Array<CellWikiElement> = tableEl.firstRow();
        var classToInit = firstRow[0].cellEntry;
        var colonIndex = classToInit.indexOf(":");
        classToInit = classToInit.substr(colonIndex+1);
        classToInit = this.fitUtils.camelCaseClass(classToInit);
        var objectUnderTest = this.initializeClass(classToInit, firstRow);
        this.checkQueryMethodIn(objectUnderTest, firstRow, classToInit);
        var results = this.callQueryMethod(objectUnderTest, firstRow);
        var fieldHeaders = this.processFieldHeadersIn(tableEl);
        this.processRows(tableEl, fieldHeaders, results);
    }

    checkQueryMethodIn(objectUnderTest:any, firstRow:Array<CellWikiElement>, classToInit: string) {
        var cell:CellWikiElement = firstRow[1];
        if (objectUnderTest.prototype["query"] === undefined) {
            cell.status = "FAILED";
            cell.msg = "Method query() not found in class " + classToInit;
        } else {
            cell.status = "PASSED";
        }
    }
    callQueryMethod(objectUnderTest, firstRow:Array<CellWikiElement>) {
        var queryParameter = firstRow[1].cellEntry;
        return objectUnderTest.prototype["query"](queryParameter);
    }

    processFieldHeadersIn(tableEl:TableWikiElement): Array<string> {
        return _.pluck(tableEl.rows[1], 'cellEntry');
    }

    matchedRow(resultRow, fieldHeaders:Array<string>, tableEl: TableWikiElement) {
        var highestMatchCount = 0;
        var matchedRow = -1;
        for (var rowIndex=2;rowIndex<tableEl.rows.length;rowIndex++) {
            var row = tableEl.rows[rowIndex];
            var matchCount = 0;
            for (var colIndex=0;colIndex<fieldHeaders.length;colIndex++) {
                var actual = resultRow[fieldHeaders[colIndex]];
                var expected = row[colIndex].cellEntry;
                if (actual === expected) {
                    matchCount++;
                    if (matchCount > highestMatchCount) {
                        highestMatchCount = matchCount;
                        matchedRow = rowIndex;
                    }
                }
            }
        }
        return matchedRow;
    }
    processRows(tableEl:TableWikiElement, fieldHeaders:Array<string>, results:Array<any>) {
        var surplus = this.matchResultsToTableAndReturnSurplus(results, fieldHeaders, tableEl);
        for (var i=2;i<tableEl.rows.length;i++) {
            var row = tableEl.rows[i];
            this.processRow(row, results, fieldHeaders);
        }
        this.processSurplusRows(surplus, results, fieldHeaders, tableEl);
    }

    processSurplusRows(surplus, results, fieldHeaders, tableEl) {
        for (var i = 0; i < surplus.length; i++) {
            var surplusRow = results[surplus[i]];
            this.processSurplusRow(fieldHeaders, surplusRow, tableEl);
        }
    }

    processSurplusRow(fieldHeaders, surplusRow, tableEl) {
        var tableRow = new Array<CellWikiElement>();
        for (var j = 0; j < fieldHeaders.length; j++) {
            var cellEntry = surplusRow[fieldHeaders[j]];
            tableRow.push(new CellWikiElement(cellEntry));
        }
        tableRow[0].status = "IGNORED";
        tableRow[0].msg = "surplus";
        tableEl.rows.push(tableRow);
    }

    processRow(row, results, fieldHeaders) {
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
    }

    matchResultsToTableAndReturnSurplus(results, fieldHeaders, tableEl):Array<number> {
        var surplus:Array<number> = new Array();
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
    }
}

class ScriptProcessor extends Processor {
    process(tableEl:TableWikiElement) {

    }
}