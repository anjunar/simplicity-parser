function regexTokenizer() {
    let index = 0;
    let lastIndex = 0;
    return {
        exec(expression) {
            if (expression.charAt(index) === "/") {
                for (let i = index; i < expression.length; i++) {
                    const element = expression.charAt(i);
                    lastIndex = i + 1;

                    if (element === "/") {
                        if (i > index && expression.charAt(i - 1) !== "\\") {
                            let flag = expression.charAt(i + 1);
                            if (["i", "g", "m", "s", "u", "y"].includes(flag)) {
                                ++lastIndex;
                            }
                            return {
                                0: expression.substring(index, lastIndex),
                                1: expression.substring(index, lastIndex),
                                index: index,
                                lastIndex: lastIndex
                            }
                        }
                    }
                }
            }
            return null;
        },
        get index() {
            return index;
        },
        set index(value) {
            index = value;
        },
        get lastIndex() {
            return lastIndex;
        },
        set lastIndex(value) {
            lastIndex = value;
            index = value;
        }
    }
}


function templateTokenizer() {
    let index = 0;
    let lastIndex = 0;
    return {
        exec(expression) {
            for (let i = index; i < expression.length; i++) {
                const element = expression.charAt(i);
                lastIndex = i + 1;

                if (element === "`") {
                    if (expression.charAt(i - 1) !== "\\") {
                        return {
                            0: expression.substring(index, lastIndex - 1),
                            1: expression.substring(index, lastIndex - 1),
                            index: index,
                            lastIndex: lastIndex
                        }
                    }
                }

                if (element === "{") {
                    if (expression.charAt(i - 1) === "$" && expression.charAt(i - 2) !== "\\") {
                        return {
                            0: expression.substring(index, lastIndex),
                            1: expression.substring(index, lastIndex - 2),
                            index: index,
                            lastIndex: lastIndex
                        }
                    }
                }
            }
            return null;
        },
        get index() {
            return index;
        },
        set index(value) {
            index = value;
        },
        get lastIndex() {
            return lastIndex;
        },
        set lastIndex(value) {
            lastIndex = value;
            index = value;
        }
    }
}

// https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Operators/Operator_Precedence

export const tags = [
    {
        type: "reserved",
        regex: /(undefined|null)/y,
        keyWord: true
    },
    {
        type: "boolean",
        regex: /(true|false)/y,
        keyWord: true
    },
    {
        type: "variableDeclarations",
        regex: /(let|const|var)/y,
        keyWord: true
    },
    {
        type: "function",
        regex: /((?:async\s+)?function(?:\s*\*\s*)?)/y,
        keyWord: true
    },
    {
        type: "operation",
        regex: /(void)/y,
        keyWord: true,
        precedence: 16
    },
    {
        type: "this",
        regex: /(this)/y,
        keyWord: true,
    },
    {
        type: "new",
        regex: /(new)/y,
        keyWord: true,
        precedence: 19
    },
    {
        type: "yield",
        regex: /(yield(?:\s*\*)?)/y,
        keyWord: true
    },
    {
        type: "for",
        regex: /(for(?:\s+await)?)\s*\(/y,
        keyWord: true
    },
    {
        type: "operation",
        regex: /(in|of)\s/y,
        keyWord: true,
        precedence: 11
    },
    {
        type: "do",
        regex: /(do)\s/y,
        keyWord: true
    },
    {
        type: "while",
        regex: /(while)/y,
        keyWord: true
    },
    {
        type: "continue",
        regex: /(continue(?: +\w+)?)/y,
        keyWord: true
    },
    {
        type: "break",
        regex: /(break(?: +\w+)?)/y,
        keyWord: true
    },
    {
        type: "class",
        regex: /(class)/y,
        keyWord: true
    },
    {
        type: "extends",
        regex: /(extends)/y,
        keyWord: true
    },
    {
        type: "static",
        regex: /(static)/y,
        keyWord: true
    },
    {
        type: "get",
        regex: /(get)/y,
        keyWord: true
    },
    {
        type: "set",
        regex: /(set)/y,
        keyWord: true
    },
    {
        type: "return",
        regex: /(return)/y,
        keyWord: true
    },
    {
        type: "import",
        regex: /(import)/y,
        keyWord: true
    },
    {
        type: "importOperator",
        regex: /(as|from) /y,
        keyWord: true
    },
    {
        type: "exportDefault",
        regex: /(export default)/y,
        keyWord: true
    },
    {
        type: "export",
        regex: /(export)/y,
        keyWord: true
    },
    {
        type: "if",
        regex: /(if)/y,
        keyWord: true
    },
    {
        type: "else",
        regex: /(else)/y,
        keyWord: true
    },
    {
        type: "switch",
        regex: /(switch)/y,
        keyWord: true
    },
    {
        type: "case",
        regex: /(case)/y,
        keyWord: true
    },
    {
        type: "default",
        regex: /(default)/y,
        keyWord: true
    },
    {
        type: "operation",
        regex: /(typeof)/y,
        keyWord: true,
        precedence: 16
    },
    {
        type: "spread",
        regex: /(\.\.\.)/y,
        keyWord: false
    },
    {
        type: "comment",
        regex: /(\/\*.*?\*\/)/ys,
        keyWord: false,
        multiLine : true
    },
    {
        type: "comment",
        regex: /(\/\/[^\n]*)/y,
        keyWord: false
    },
    {
        type: "regex",
        regex: regexTokenizer(),
        keyWord: false
    },
    {
        type: "arrow",
        regex: /(=>)/y,
        keyWord: false
    },
    {
        type: "assignment",
        regex: /([><+-]{1,2}=)/y,
        keyWord: false
    },
    {
        type: "operation",
        regex: /(!|~|\+\+|--)/y,
        keyWord: false,
        precedence: 16
    },
    {
        type: "operation",
        regex: /([*]{2})/y,
        keyWord: false,
        precedence: 15
    },
    {
        type: "operation",
        regex: /([*/%])/y,
        keyWord: false,
        precedence: 14
    },
    {
        type: "operation",
        regex: /([+-])/y,
        keyWord: false,
        precedence: 13
    },
    {
        type: "operation",
        regex: /(<<|>>|>>>)/y,
        keyWord: false,
        precedence: 12
    },
    {
        type: "operation",
        regex: /(<|<=|>|>=)/y,
        keyWord: false,
        precedence: 11
    },
    {
        type: "operation",
        regex: /(===|==|!=|!==)/y,
        keyWord: false,
        precedence: 10
    },
    {
        type: "operation",
        regex: /(&&)/y,
        keyWord: false,
        precedence: 6
    },
    {
        type: "operation",
        regex: /(\|\|)/y,
        keyWord: false,
        precedence: 5
    },
    {
        type: "operation",
        regex: /(&)/y,
        keyWord: false,
        precedence: 9
    },
    {
        type: "operation",
        regex: /(\^)/y,
        keyWord: false,
        precedence: 8
    },
    {
        type: "operation",
        regex: /(\|)/y,
        keyWord: false,
        precedence: 7
    },
    {
        type: "assignment",
        regex: /(=)/y,
        keyWord: false
    },
    {
        type: "number",
        regex: /(-?((\d*\.\d+|\d+)([Ee][+-]?\d+)?))/y,
        keyWord: false
    },
    {
        type: "property",
        regex: /([a-zA-Z$_][a-zA-Z\d_$]*)/y,
        keyWord: false
    },
    {
        type: "point",
        regex: /(\.)/y,
        keyWord: false
    },
    {
        type: "string",
        regex: /'([^']*)'/y,
        keyWord: false
    },
    {
        type: "string",
        regex: /"([^"]*)"/y,
        keyWord: false
    },
    {
        type: "template",
        regex: /(`)/y,
        keyWord: false
    },
    {
        type: "conditional",
        regex: /(\?)/y,
        keyWord: false
    },
    {
        type: "leftRoundBracket",
        regex: /(\()/y,
        keyWord: false
    },
    {
        type: "rightRoundBracket",
        regex: /(\))/y,
        keyWord: false
    },
    {
        type: "leftCurlyBracket",
        regex: /({)/y,
        keyWord: false
    },
    {
        type: "rightCurlyBracket",
        regex: /(})/y,
        keyWord: false
    },
    {
        type: "leftSquareBracket",
        regex: /(\[)/y,
        keyWord: false
    },
    {
        type: "rightSquareBracket",
        regex: /(])/y,
        keyWord: false
    },
    {
        type: "semicolon",
        regex: /(;)/y,
        keyWord: false,
    },
    {
        type: "semicolon",
        regex: /([;\n])/y,
        keyWord: false,
        nWhiteSpace : true
    },
    {
        type: "whitespace",
        regex: /([‌\s‍]+)/y,
        keyWord: false
    },
    {
        type: "colon",
        regex: /(:)/y,
        keyWord: false
    },
    {
        type: "comma",
        regex: /(,)/y,
        keyWord: false
    },
]

export function tokenizer(expression) {

    let index = 0;
    let oldIndex = -1;
    let cursor = null
    let tokens = [];

    return {
        capture() {
            return expression.substring(0, index)
        },
        previous(options = {}) {
            if (! Reflect.has(options, "keyWords")) {
                options.keyWords = true;
            }

            index = tokens[tokens.length - 2].index
            oldIndex = null;
            return this.next(options);
        },
        current() {
            return cursor;
        },
        next(options = {}) {
            if (! Reflect.has(options, "keyWords")) {
                options.keyWords = true;
            }

            oldIndex = -1
            while (index < expression.length) {

                let char = expression.charAt(index);

                if (index === oldIndex) {
                    cursor = null;
                    return cursor;
                }

                oldIndex = index;

                let filteredTags

                if (options.expected) {
                    filteredTags = tags.filter((tag) => options.expected.includes(tag.type) || tag.type === "whitespace")
                } else {
                    if (options.keyWords) {
                        filteredTags = tags;
                    } else {
                        filteredTags = tags.filter((tag) => tag.keyWord === false)
                    }

                    if (! options.nWhiteSpace) {
                        filteredTags = filteredTags.filter((tag) => ! tag.nWhiteSpace)
                    }

                    if (options.template) {
                        filteredTags = [{
                            type: "template",
                            regex: templateTokenizer(),
                            keyWord: false
                        }]
                    }
                }


                for (const tag of filteredTags) {
                    tag.regex.lastIndex = index;
                    let result = tag.regex.exec(expression);
                    if (result) {
                        if (tag.type !== "whitespace" && (tag.type !== "comment")) {
                            let token = {
                                type: tag.type,
                                value: result[1],
                                raw: result[0],
                                index: result.index,
                                lastIndex: tag.regex.lastIndex || result.lastIndex,
                                precedence: tag.precedence
                            };
                            index = tag.regex.lastIndex || result.lastIndex;

                            cursor = token;

                            tokens.push(cursor);

                            return cursor;
                        } else {
                            if (tag.type === "comment" && tag.multiLine) {
                                if (result[1].includes("\n")) {
                                    let token = {
                                        type: "semicolon",
                                        value: result[1],
                                        raw: result[0],
                                        index: result.index,
                                        lastIndex: tag.regex.lastIndex || result.lastIndex,
                                        precedence: tag.precedence
                                    };
                                    index = tag.regex.lastIndex || result.lastIndex;

                                    cursor = token;

                                    tokens.push(cursor);

                                    return cursor;
                                }
                            }
                            index = tag.regex.lastIndex || result.lastIndex;
                            break;
                        }
                    }
                }

            }
            cursor = null;
            return cursor
        }
    };
}
