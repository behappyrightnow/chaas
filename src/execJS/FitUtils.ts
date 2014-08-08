
class FitUtils {
    capitalized(word: string) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }
    camelCaseClass(text:string) {
        var words = text.split(" ");
        var answer = "";
        for (var i=0;i<words.length;i++) {
            answer += this.capitalized(words[i]);
        }
        return answer;
    }

    camelCase(text:string) {
        if (text.indexOf(" ") === -1) {
            return text;
        }
        var words = text.split(" ");
        var answer = words[0];
        for (var i=1;i<words.length;i++) {
            answer += this.capitalized(words[i]);
        }
        return answer;
    }

    wikiData(lines:Array<string>):Array<WikiElement> {
        var tableFound:boolean = false;
        var tableElement:TableWikiElement;
        var answer: Array<WikiElement> = new Array();
        _.each(lines, function(line) {
            if (!tableFound) {
                if (line.charAt(0) === '|') {
                    tableFound = true;
                    tableElement = new TableWikiElement();
                    tableElement.addRow(line);
                } else {
                    answer.push(new DefaultElement(line));
                }
            } else if (tableFound) {
                if (line.charAt(0) !== '|') {
                    tableFound = false;
                    answer.push(tableElement);
                    tableElement = null;
                    answer.push(new DefaultElement(line));
                } else {
                    tableElement.addRow(line);
                }
            }
        })
        if (tableElement !== null) {
            answer.push(tableElement);
        }
        return answer;
    }
}

interface WikiElement {
    type: string;
}
class DefaultElement implements WikiElement {
    line: string;
    type: string;
    constructor(line:string) {
        this.line = line;
        this.type = "DEFAULT";
    }
}

class TableWikiElement implements WikiElement {
    rows: Array<Array<CellWikiElement>>;
    type: string;
    tableStart: boolean;
    maxCols: number;

    constructor() {
        this.type = "TABLE";
        this.rows = new Array();
        this.maxCols = 1;
    }
    addRow(row: string) {
        var cells = this.parseCells(row);
        var cellElements = new Array<CellWikiElement>();
        _.each(cells, function(cell) {
            cellElements.push(new CellWikiElement(cell));
        })
        this.rows.push(cellElements);
        if (cells.length > this.maxCols) {
            this.maxCols = cells.length;
        }
    }

    firstRow(): Array<CellWikiElement> {
        return this.rows[0];
    }


    parseCells(row) {
        var tempLine:string = row.substr(1);
        var lastSlashLoc = tempLine.lastIndexOf("|");
        tempLine = tempLine.substr(0,lastSlashLoc);
        return tempLine.split("|");
    }

}

class CellWikiElement {
    cellEntry: string;
    status: string;
    msg: string;
    expected: string;
    actual: string;
    constructor(cellEntry:string) {
        this.cellEntry = cellEntry;
        this.status = "IDLE";
        this.msg = null;
        this.expected = null;
        this.actual = null;
    }
}
var fitUtils = new FitUtils();

class Method {
    methodName: string;
    isInput: boolean;
    constructor(methodString, isInput: boolean) {
        this.methodName = fitUtils.camelCase(methodString);
        this.isInput = isInput;
    }
}