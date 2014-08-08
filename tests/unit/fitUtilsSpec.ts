'use strict';

describe('FitUtils', function () {
    var fitUtils: FitUtils;
    beforeEach(function() {
       fitUtils = new FitUtils();
    });
    it("should camel case Class properly", function() {
        console.log(fitUtils.camelCaseClass("should i buy milk"));
        expect(fitUtils.camelCaseClass("should i buy milk")).toBe("ShouldIBuyMilk");
    });
    it("should camel case properly", function() {
        console.log(fitUtils.camelCase("cash in wallet"));
        expect(fitUtils.camelCase("cash in wallet")).toBe("cashInWallet");
    });
    describe("Wiki Element Creation", function() {
        it("should turn strings into Default Elements", function() {
            var listOfStrings = ["Hello", "World", "Again"];
            WikiElement fitUtils.wikiData(listOfStrings);
        })

    })
});