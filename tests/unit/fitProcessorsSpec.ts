'use strict';
/// <reference path="../../typeScriptHeaders/jquery/jquery.d.ts"/>
/// <reference path="../../typeScriptHeaders/jasmine/jasmine.d.ts"/>
/// <reference path="../../src/execJS/FitProcessors.ts"/>
describe('FitProcessors', function () {
    var tableEl: TableWikiElement;

    describe('Decision Processor', function() {
        var decisionProcessor: DecisionProcessor;
        beforeEach(function() {
            var fitUtils = new FitUtils();
            var wikiElements:Array<WikiElement> = fitUtils.wikiData(["|add ten|","|number|result?|","|10|20|"]);
            var tableElement:TableWikiElement = wikiElements[0];
            decisionProcessor = new DecisionProcessor(tableElement);
        });
        it("should not be undefined", function() {
            expect(decisionProcessor).not.toBe(undefined);
        });
        it("should detect question mark", function(){
            var methodName = "my query method?";
            expect(decisionProcessor.hasQuestionMark(methodName)).toBe(true);
            var methodName = "regular input method";
            expect(decisionProcessor.hasQuestionMark(methodName)).toBe(false);
        });
        it("should create an input method", function() {
            var methodString = "new method";
            var method = decisionProcessor.createInputMethod(methodString);
            expect(method instanceof Method).toBe(true);
            expect(method.isInput).toBe(true);
        });
        it("should create an output method", function() {
            var methodString = "new output method?";
            var method = decisionProcessor.createOutputMethod(methodString);
            expect(method instanceof Method).toBe(true);
            expect(method.isInput).toBe(false);
        });
        it("should generate name for input and output method correctly", function() {
            var methodString = "input method";
            var method = decisionProcessor.createInputMethod(methodString);
            expect(method.methodName).toBe("inputMethod");
            var methodString = "output method?";
            var method = decisionProcessor.createOutputMethod(methodString);
            expect(method.methodName).toBe("outputMethod");
        });
        describe("handles classes with attributes and execute() correctly", function() {
            var tableEl: TableWikiElement;
            var methods: Array<Method>;
            var objectUnderTest: any;
            beforeEach(function() {
                tableEl = new TableWikiElement();
                tableEl.addRow("|Division|");
                tableEl.addRow("|numerator|denominator|quotient?|remainder?|");
                tableEl.addRow("|10|4|2|2|");
                tableEl.addRow("|10|3|3|1|");
                methods = new Array<Method>();
                methods.push(decisionProcessor.createInputMethod("numerator"));
                methods.push(decisionProcessor.createInputMethod("denominator"));
                methods.push(decisionProcessor.createOutputMethod("quotient?"));
                methods.push(decisionProcessor.createOutputMethod("remainder?"));
                objectUnderTest = new window["Division"];
                decisionProcessor.processRows(tableEl, methods, objectUnderTest);
            });
            it("should produce correct results", function() {
                expect(tableEl.rows[2][2].status).toBe("PASSED");
                expect(tableEl.rows[2][3].status).toBe("PASSED");
                expect(tableEl.rows[3][2].status).toBe("PASSED");
                expect(tableEl.rows[3][3].status).toBe("PASSED");
            });
        });
        describe("handles classes with setters and getters correctly", function() {
            var tableEl: TableWikiElement;
            var methods: Array<Method>;
            var objectUnderTest: any;
            beforeEach(function() {
                tableEl = new TableWikiElement();
                tableEl.addRow("|Addition|");
                tableEl.addRow("|first|second|sum?|");
                tableEl.addRow("|1|2|3|");
                tableEl.addRow("|10|3|13|");
                methods = new Array<Method>();
                methods.push(decisionProcessor.createInputMethod("first"));
                methods.push(decisionProcessor.createInputMethod("second"));
                methods.push(decisionProcessor.createOutputMethod("sum?"));
                objectUnderTest = new window["Addition"];
                decisionProcessor.processRows(tableEl, methods, objectUnderTest);
            });
            it("should produce correct results", function() {
                expect(tableEl.rows[2][2].status).toBe("PASSED");
                expect(tableEl.rows[3][2].status).toBe("PASSED");
            });
        });


    });
    describe("Query Processor", function() {
        var queryProcessor: QueryProcessor;
        beforeEach(function() {
            var fitUtils = new FitUtils();
            var wikiElements:Array<WikiElement> =
                fitUtils.wikiData([
                    "|query:people over|21|",
                    "|name|age|sex|",
                    "|John Doe|23|M|",
                    "|Jane Poe|22|F|"
                ]);
        });

    });
    describe("Script Processor", function() {

    });
});

class Division {
    numerator: number;
    denominator: number;
    quotient: number;
    remainder: number;

    execute() {
        this.quotient = Math.floor(this.numerator / this.denominator);
        this.remainder = this.numerator % this.denominator;
    }

}

class Addition {
    a: number;
    b: number;
    first(a:number) {
        this.a = a;
    }
    second(b:number) {
        this.b = b;
    }
    sum(): number{
        return Number(this.a) + Number(this.b);
    }
}