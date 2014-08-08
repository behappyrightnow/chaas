'use strict';
/// <reference path="../../typeScriptHeaders/jquery/jquery.d.ts"/>
/// <reference path="../../typeScriptHeaders/jasmine/jasmine.d.ts"/>
/// <reference path="../../src/execJS/FitUtils.ts"/>
describe('FitUtils', function () {
    var fitUtils: FitUtils;
    beforeEach(function() {
       fitUtils = new FitUtils();
    });
    it("should camel case Class properly", function() {
        expect(fitUtils.camelCaseClass("should i buy milk")).toBe("ShouldIBuyMilk");
    });
    it("should camel case properly", function() {
        expect(fitUtils.camelCase("cash in wallet")).toBe("cashInWallet");
    });
    describe("Wiki Element Creation", function() {
        it("should turn strings into Default Elements", function() {
            var listOfStrings = ["Hello", "World", "Again"];
            var wikiElements:Array<WikiElement> = fitUtils.wikiData(listOfStrings);
            expect(wikiElements).not.toBe(undefined);
            for (var i=0;i<wikiElements.length;i++) {
                expect(wikiElements[i]).not.toBe(undefined);
                expect(wikiElements[i].type).toBe("DEFAULT");
            }
        });
        it("should turn piped strings into Table Elements", function () {
            var listOfStrings = ["|Hello|World|", "|This Is |A Table|"];
            var wikiElements = fitUtils.wikiData(listOfStrings);
            expect(wikiElements).not.toBe(undefined);
            for (var i = 0; i < wikiElements.length; i++) {
                expect(wikiElements[i]).not.toBe(undefined);
                expect(wikiElements[i].type).toBe("TABLE");
            }
        });

    })
});