'use strict';
/// <reference path="../../typeScriptHeaders/jquery/jquery.d.ts"/>
/// <reference path="../../typeScriptHeaders/jasmine/jasmine.d.ts"/>
/// <reference path="../../src/execJS/FitProcessors.ts"/>
describe('FitProcessors', function () {
    var tableEl: TableWikiElement;

    describe('DecisionProcessor', function() {
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
    });
});