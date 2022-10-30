import {tokenizer} from "./tokenizer.js";

export class TopLevelParser {
    statement(walk, state) {
        let result = walk([]);

        let token = state.current();

        while (token && token.type === "semicolon") {
            token = state.next();
        }

        return result;
    }

    import(state, stack, walk) {
        return this.statement(walk, state);
    }

    class(state, stack, walk) {
        return this.statement(walk, state);
    }

    function(state, stack, walk) {
        return this.statement(walk, state);
    }

    variableDeclarations(state, stack, walk) {
        return this.statement(walk, state);
    }

    for(state, stack, walk) {
        return this.statement(walk, state);
    }

    break(state, stack, walk) {
        return this.statement(walk, state);
    }

    do(state, stack, walk) {
        return this.statement(walk, state);
    }

    while(state, stack, walk) {
        return this.statement(walk, state);
    }

    if(state, stack, walk) {
        return this.statement(walk, state);
    }

    switch(state, stack, walk) {
        return this.statement(walk, state);
    }

    default(state, stack, walk) {
        let node = {
            type: "ExpressionStatement"
        };

        node.expression = walk([node]);

        let token = state.current();

        while (token && token.type === "semicolon") {
            token = state.next();
        }

        return node
    }
}

let arrowStack = [];

export class Parser {
    isTopPredicate(parent, type, positions) {
        if (parent.length === 0) {
            return true;
        }
        let result = parent[parent.length - 1]
        return result.type === type && positions.includes(result.position);
    }

    topType(parent) {
        if (parent.length > 0) {
            return parent[parent.length - 1].type
        }
        return true;
    }

    topPosition(parent) {
        if (parent.length > 0) {
            return parent[parent.length -1].position
        }
        return true;
    }

    isSequenceExpression(token, init) {
        return token.type === "comma" &&
            this.topType(init) !== "ArrayPattern" &&
            this.topType(init) !== "ImportStatement" &&
            this.topType(init) !== "ImportNamespaceSpecifier" &&
            this.topType(init) !== "ImportDefaultSpecifier" &&
            this.topType(init) !== "ImportSpecifier" &&
            this.topType(init) !== "ObjectPattern" &&
            this.topType(init) !== "ObjectExpression" &&
            this.topType(init) !== "SequenceExpression" &&
            this.topType(init) !== "AssignmentExpression" &&
            this.topType(init) !== "ExportSpecifier" &&
            ! init.some((node) => node.type === "UnaryExpression" && node.position === "argument") &&
            ! init.some((node) => node.type === "CallExpression")
    }

    isBinaryExpression(token, init) {
        return token.type === "operation" &&
            this.topPosition(init) !== "rhs" &&
            this.topType(init) !== "VariableDeclarator" &&
            ! this.isTopPredicate(init, "UnaryExpression", ["argument"]) &&
            ! this.isTopPredicate(init, "MemberExpression", ["property"]);
    }

    isConditionalExpression(token, init) {
        return token.type === "conditional" &&
            ! this.isTopPredicate(init, "MemberExpression", ["property"]) &&
            ! this.isTopPredicate(init, "BinaryExpression", ["rhs"]);
    }

    isMemberExpression(token, init) {
        return (token.type === "point" || token.type === "leftSquareBracket") &&
            ! this.isTopPredicate(init, "MemberExpression", ["property"]);
    }

    isLabeledStatement(token, init) {
        return token.type === "colon" &&
            this.topType(init) !== "ObjectExpression" &&
            this.topType(init) !== "ObjectPattern" &&
            this.topType(init) !== "SwitchCase";
    }

    isCallExpression(token, init) {
        return token.type === "leftRoundBracket" &&
            ! init.some((node) => node.type === "NewExpression" && node.position === "callee") &&
            ! this.isTopPredicate(init, "MemberExpression", ["property"]) &&
            ! this.isTopPredicate(init, "FunctionDeclaration", ["id", "init"]) &&
            ! this.isTopPredicate(init, "FunctionExpression", ["id", "init"]) &&
            this.topType(init) !== "ObjectExpression" &&
            this.topType(init) !== "NewExpression" &&
            this.topType(init) !== "ClassBody";
    }

    isArrowFunctionExpression(token) {
        return token.type === "arrow";
    }

    isAssignmentExpression(token, init) {
        return token.type === "assignment" &&
            this.topType(init) !== "VariableDeclarator" &&
            this.topType(init) !== "ClassBody" &&
            ! this.isTopPredicate(init, "MemberExpression", ["property"]);
    }

    isObjectPattern(init) {
        return this.topType(init) === "VariableDeclarator"
            || this.topType(init) === "ArrayPattern"
            || this.isTopPredicate(init, "FunctionExpression", ["params"])
            || this.isTopPredicate(init, "FunctionDeclaration", ["params"])
            || this.topType(init) === "AssignmentExpression"
            || this.topType(init) === "ReturnStatement"
            || this.topType(init) === "ObjectExpression"
            || this.topType(init) === "ObjectPattern"
            || this.topType(init) === "SequenceExpression"
            || init[init.length - 1].parenthesis;
    }

    isBlockPattern(init) {
        return this.isTopPredicate(init, "FunctionExpression", ["body"]) ||
            this.isTopPredicate(init, "FunctionDeclaration", ["body"]) ||
            this.topType(init) === "ForStatement" ||
            this.topType(init) === "ForOfStatement" ||
            this.topType(init) === "ForInStatement" ||
            this.topType(init) === "IfStatement" ||
            this.topType(init) === "WhileStatement" ||
            this.topType(init) === "ExpressionStatement" ||
            this.topType(init) === "BlockStatement" ||
            this.topType(init) === "DoWhileStatement" ||
            this.isTopPredicate(init, "LabeledStatement", ["body"]) ||
            this.topType(init) === "ArrowFunctionExpression";
    }

    isFunctionPattern(init) {
        return this.isTopPredicate(init, "ObjectExpression", ["key"]) || this.topType(init) === "ClassBody";
    }

    isCallPattern(init) {
        return this.topType(init) === "Identifier" ||
            this.topType(init) === "MemberExpression" ||
            this.topType(init) === "FunctionExpression" ||
            this.isTopPredicate(init, "SequenceExpression", ["end"]) ||
            this.isTopPredicate(init, "CallExpression", ["end"]);
    }

    isMemberPattern(top) {
        return top && (top.type === "Identifier" || top.type === "CallExpression" || top.type === "MemberExpression");
    }

    isUnaryPattern(init) {
        return this.isTopPredicate(init, "BinaryExpression", "rhs")
            || this.topType(init) === "ExpressionStatement"
            || this.topType(init) === "BlockStatement";
    }

    //https://en.wikipedia.org/wiki/Operator-precedence_parser
    parseBinaryExpression(state, stack, walk, init, lhs, minPrecedence) {
        let token = state.current();
        let lookahead = token.precedence
        while (lookahead >= minPrecedence && token?.type === "operation") {
            let operator = state.current();
            token = state.next();
            let rhs = walk([...init, {position : "rhs", type : "BinaryExpression"}]);
            token = state.current();
            lookahead = token?.precedence || null
            while (lookahead > operator.precedence && token.type === "operation") {
                rhs = this.parseBinaryExpression(state, stack, walk, init, rhs, operator.precedence);
                token = state.current();
                lookahead = token.precedence
            }
            if (operator.value.includes("&") || operator.value.includes("|")) {
                lhs = {
                    type: "LogicalExpression",
                    operator: operator.value,
                    left: lhs,
                    right: rhs
                }
            } else {
                lhs = {
                    type: "BinaryExpression",
                    operator: operator.value,
                    left: lhs,
                    right: rhs
                }
            }
        }
        return lhs;
    }

    reserved(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "Literal",
            value: token.value === "null" ? null : token === "undefined" ? undefined : undefined,
        };

        token = state.next();

        if (token) {
            if (this.isSequenceExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }
        }

        return node;
    }

    boolean(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "Literal",
            value: token.value === "true"
        };

        token = state.next();

        if (token) {
            if (this.isBinaryExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isSequenceExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }
        }

        return node
    }

    string(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "Literal",
            value: token.value
        };

        token = state.next();

        if (token) {
            if (this.isBinaryExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isConditionalExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isSequenceExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }
        }

        return node
    }

    template(state, stack, walk, init, topLevel) {
        let token = state.current();

        token = state.next({template: true})

        let node = {
            type: "TemplateLiteral",
            quasis: [{
                type: "TemplateElement",
                value: token.value
            }],
            expressions: []
        };

        while (token.raw.endsWith("${")) {
            token = state.next({expected: ["property", "template"]});
            node.expressions.push(walk([...init, {...node, position : "expressions"}]));
            token = state.current({expected: ["rightCurlyBracket"]});
            token = state.next({template: true})
            node.quasis.push({
                type: "TemplateElement",
                value: token.value
            })
        }

        token = state.next();

        if (token) {
            if (this.isBinaryExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isConditionalExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isSequenceExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }
        }

        return node
    }

    number(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "Literal",
            value: Number(token.value)
        };

        token = state.next();

        if (token) {

            if (this.isBinaryExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isSequenceExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }
        }

        return node;
    }

    regex(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "Literal",
            value: token.value
        };

        token = state.next();

        if (token) {
            if (this.isSequenceExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }
        }

        return node;
    }

    property(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "Identifier",
            name: token.value
        };

        token = state.next({nWhiteSpace : false});

        if (token) {
            if (this.isLabeledStatement(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isConditionalExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isMemberExpression(token, init)) {
                stack.push(node)
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isCallExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isBinaryExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isAssignmentExpression(token, init)) {
                stack.push(node)
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isArrowFunctionExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isSequenceExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }
        }

        return node
    }

    spread(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "SpreadElement",
        };

        token = state.next();

        node.argument = walk([...init, {...node, position : "argument"}]);

        return node;
    }

    return(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "ReturnStatement",
        };

        token = state.next();

        if (token && token.type !== "semicolon") {
            node.argument = walk([...init, {...node, position : "argument"}]);
        }

        return node;
    }

    import(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "ImportDeclaration",
            specifiers: []
        }

        while (token && (token.type === "comma" || token.type === "import")) {
            token = state.next();
            if (token && token.type === "property") {

                let subNode = {
                    type: "ImportDefaultSpecifier",
                }

                node.specifiers.push(subNode);

                subNode.local = walk([...init, {...subNode, position : "local"}]);

                token = state.current();
            }

            if (token && token.type === "operation") {
                token = state.next();

                token = state.next();

                let subNode = {
                    type: "ImportNamespaceSpecifier",
                    local: null
                }

                node.specifiers.push(subNode);

                subNode.local = walk([...init, {...subNode, position : "local"}]);

                token = state.current();
            }

            if (token && token.type === "leftCurlyBracket") {
                token = state.next();

                while (token && token.type !== "rightCurlyBracket") {
                    token = state.current();

                    if (token && token.type === "comma") {
                        token = state.next();
                    }

                    let subNode = {
                        type: "ImportSpecifier",
                        imported: null,
                        local: null
                    }

                    node.specifiers.push(subNode);

                    let imported = walk([...init, {...subNode, position : "imported"}]);
                    subNode.imported = imported;
                    subNode.local = imported;

                    token = state.current();

                    if (token && token.type === "importOperator") {
                        token = state.next({keyWords : false});

                        subNode.local = walk([...init, {...subNode, position : "local"}]);

                        token = state.current();
                    }

                    if (token && token.type === "comma") {
                        token = state.next();
                    }
                }

                token = state.next();
            }
        }

        if (token && token.type === "importOperator") {
            token = state.next();
            node.source = walk([...init, {...node, position : "source"}]);
        } else {
            node.source = walk([...init, {...node, position : "source"}]);
        }

        return node;
    }

    this(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type : "ThisExpression"
        };

        token = state.next();

        if (token) {
            if (this.isMemberExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }
        }

        return node;
    }

    new(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type : "NewExpression",
            callee : null,
            arguments : []
        };

        token = state.next();

        node.callee = walk([...init, {...node, position : "callee"}]);

        token = state.current();

        if (token && token.type === "leftRoundBracket") {
            token = state.next();
            while (token && token.type !== "rightRoundBracket") {
                node.arguments.push(walk([...init, {...node, position : "arguments"}]));
                token = state.current();
            }
        }

        token = state.next();

        return node;
    }

    variableDeclarations(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "VariableDeclaration",
            kind: token.value,
            declarations: []
        }

        // Because of If Statement, no reassignment
        state.next();

        while (token && (token.type === "comma" || token.type === "variableDeclarations")) {
            let subNode = {
                type: "VariableDeclarator"
            };
            node.declarations.push(subNode)
            if (token && token.type === "comma") {
                state.next();
            }
            subNode.id = walk([...init, {...subNode, position : "id"}]);
            token = state.current();
            if (token && token.type === "assignment") {
                token = state.next();
                subNode.init = walk([...init, {...subNode, position : "init"}]);
                token = state.current();
            }
        }

        return node;
    }

    assignment(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "AssignmentExpression",
            operator: token.value,
            left: stack.pop(),
        };

        token = state.next();

        node.right = walk([...init, {...node, position : "right"}])

        if (token) {
            if (this.isSequenceExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }
        }

        return node;
    }

    class(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "ClassDeclaration",
        };

        token = state.next({expected: ["leftCurlyBracket", "extends", "property"]});

        if (token && (token.type !== "leftCurlyBracket" && token.type !== "extends")) {
            node.id = walk([...init, {...node, position : "id"}]);
        }

        token = state.current();

        if (token && token.type === "extends") {
            token = state.next();
            node.superClass = walk([...init, {...node, position : "superClass"}]);
            token = state.current();
        }

        node.body = this.classBody(state, stack, walk, [...init, node])

        return node;
    }
    
    classBody(state, stack, walk, init, topLevel) {
        let token = state.current();
        let node = {
            type: "ClassBody",
            body: []
        };
        token = state.next({keyWords : false});

        while (token && token.type !== "rightCurlyBracket") {
            let staticFlag = false, getter = false, setter = false

            while (token && token.type === "semicolon") {
                token = state.next({keyWords : false});
            }

            if (token.value === "static") {
                token = state.next({keyWords : false});
                if (token.value === "get" || token.value === "set") {
                    let temp = token;
                    staticFlag = true;
                    token = state.next({keyWords : false})
                    if (token && token.type === "property") {
                        getter = temp.value === "get"
                        setter = temp.value === "set"
                    } else {
                        token = state.previous({keyWords : false});
                    }
                }
            }

            if (token.value === "get" || token.value === "set") {
                let temp = token;
                token = state.next({keyWords : false})
                if (token && token.type === "property") {
                    getter = temp.value === "get"
                    setter = temp.value === "set"
                } else {
                    token = state.previous({keyWords : false});
                }
            }

            if (token && token.type !== "rightCurlyBracket") {
                let key = walk([...init, {...node, position : "key"}]);
                token = state.current();

                let subNode;
                if (token && token.type === "assignment") {
                    subNode = {
                        type: "PropertyDefinition",
                        key: key,
                        static: staticFlag
                    };
                    token = state.next({keyWords : false});
                    subNode.value = walk([...init, {...node, position : "value"}]);
                    token = state.previous();
                    token = state.next({keyWords : false});
                    while (token && token.type === "semicolon") {
                        token = state.next({keyWords : false});
                    }
                }
                if (token && token.type === "leftRoundBracket") {
                    subNode = {
                        type: "MethodDefinition",
                        key: key,
                        static: staticFlag,
                        kind : "method"
                    }
                    if (getter) {
                        subNode.kind = "get"
                    }
                    if (setter) {
                        subNode.kind = "set"
                    }

                    node.body.push(subNode);

                    subNode.value = walk([...init, {...node, position : "value"}]);

                    token = state.previous();
                    token = state.next({keyWords : false});
                    while (token && token.type === "semicolon") {
                        token = state.next({keyWords : false});
                    }
                }

            }
        }

        token = state.next();

        return node;
    }

    exportDefault(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "ExportDefaultStatement"
        };

        token = state.next();

        node.declaration = walk([...init, {...node, position : "declaration"}]);

        return node;
    }

    export(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "ExportStatement"
        };

        token = state.next();

        if (token && token.type === "leftCurlyBracket") {
            node.type = "ExportNamedDeclaration";
            node.specifiers = [];
            token = state.next();

            while (token && token.type !== "rightCurlyBracket") {
                token = state.current();

                if (token && token.type === "comma") {
                    token = state.next();
                }

                let subNode = {
                    type: "ExportSpecifier",
                    exported: null,
                    local: null
                }

                node.specifiers.push(subNode);

                let imported = walk([...init, {...subNode, position : "exported"}]);
                subNode.exported = imported;
                subNode.local = imported;

                token = state.current();

                if (token && token.type === "importOperator") {
                    token = state.next({keyWords : false});

                    subNode.local = walk([...init, {...subNode, position : "local"}]);

                    token = state.current();
                }

                if (token && token.type === "comma") {
                    token = state.next();
                }
            }

        } else {
            node.declaration = walk([...init, {...node, position : "declaration"}]);
        }

        token = state.next();

        if (token && token.type === "importOperator") {
            token = state.next();
            node.source = walk([...init, {...node, position : "source"}]);
        }

        return node;
    }

    function(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node;
        if (init.length > 0 && this.topType(init) !== "BlockStatement") {
            node = {
                type: "FunctionExpression",
                async: token.value.indexOf("async") > -1,
                generator: token.value.indexOf("*") > -1,
                params: []
            }
        } else {
            node = {
                type: "FunctionDeclaration",
                async: token.value.indexOf("async") > -1,
                generator: token.value.indexOf("*") > -1,
                params: []
            }
        }

        token = state.next();

        if (token && token.type !== "leftRoundBracket") {
            node.id = walk([...init, {...node, position : "id"}]);
        }

        token = state.next();

        while (token && token.type !== "rightRoundBracket") {
            node.params.push(walk([...init, {...node, position : "params"}]));
            token = state.current();
        }

        token = state.next();

        if (token && token.type === "semicolon") {
            token = state.next();
        } else {
            node.body = walk([...init, {...node, position : "body"}]);
        }

        token = state.current();

        if (token) {
            if (this.isMemberExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }
            if (this.isCallExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }
        }

        return node;

    }

    yield(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "YieldExpression",
            delegate: token.value.indexOf("*") > -1,
        };

        token = state.next();

        if (token && (token.type !== "rightCurlyBracket" && token.type !== "semicolon" && token.type !== "rightRoundBracket" && token.type !== "arrow"))  {
            node.argument = walk([...init, {...node, position : "argument"}]);
        }

        token = state.current();

        if (token) {
            if (this.isSequenceExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}])
            }
            if (this.isArrowFunctionExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}])
            }
        }

        return node;
    }

    for(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type : "ForStatement",
            await: token.value.indexOf("await") > -1,
            body : {
                type : "EmptyStatement"
            }
        };

        token = state.next();

        let forInit;
        if (token && token.type !== "semicolon") {
            forInit = walk([...init, {...node, position : "init"}]);
        }

        token = state.current();

        if (token && token.type === "semicolon") {
            node.type = "ForStatement"
            node.init = forInit;
            token = state.next();
            if (token && token.type !== "semicolon") {
                node.test = walk([...init, {...node, position : "test"}]);
                token = state.next();
            }
            if (token && (token.type !== "semicolon" && token.type !== "rightRoundBracket")) {
                node.update = walk([...init, {...node, position : "update"}]);
                token = state.next();
            } else {
                token = state.next();
            }
        }

        if (token && token.type === "operation") {
            switch (token.value) {
                case "of" :
                    node.type = "ForOfStatement";
                    break;
                case "in" :
                    node.type = "ForInStatement";
                    break;
                default :
                    throw new Error("in or of expected")
            }
            node.left = forInit;
            token = state.next();
            node.right = walk([...init, {...node, position : "right"}]);
            token = state.next();
        }

        if (token && token.type === "semicolon") {
            token = state.next();
        }

        if (token && token.type === "rightRoundBracket") {
            token = state.next();
        }
        if (token && token.type === "leftCurlyBracket") {
            node.body = walk([...init, {...node, position : "body"}])
        }

        if (token) {
            if (this.isCallExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}])
            }
        }

        return node;
    }

    do(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "DoWhileStatement"
        };

        token = state.next();

        node.body = walk([...init, {...node, position : "body"}]);

        token = state.current();

        while (token && token.type === "semicolon") {
            token = state.next();
        }

        if (token && token.type === "while") {
            token = state.next();

            token = state.next();

            node.test = walk([...init, {...node, position : "test"}]);

            token = state.next();
        }

        return node;
    }

    while(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "WhileStatement",
        };

        token = state.next();
        token = state.next();

        node.test = walk([...init, {...node, position : "test"}]);

        token = state.next();

        if (token && token.type === "leftCurlyBracket") {
            node.body = walk([...init, {...node, position : "body"}]);
        }

        return node;
    }

    continue(state, stack, walk, init, topLevel) {
        let token = state.current();
        let regex = /continue(?: +(\w+))?/
        let result = regex.exec(token.value);

        let node = {
            type: "ContinueStatement"
        };

        if (result[1]) {
            node.label = {
                type : "Identifier",
                name : result[1]
            }
        }

        token = state.next();

        return node;
    }

    break(state, stack, walk, init, topLevel) {
        let token = state.current();
        let regex = /break(?: +(\w+))?/
        let result = regex.exec(token.value);

        let node = {
            type: "BreakStatement"
        };

        if (result[1]) {
            node.label = {
                type : "Identifier",
                name : result[1]
            }
        }

        token = state.next();

        return node;
    }

    colon(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "LabeledStatement",
            label: stack.pop()
        };

        token = state.next();

        node.body = walk([...init, {...node, position : "body"}]);

        return node;
    }

    comma(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "SequenceExpression",
            expressions: [stack.pop()]
        };

        token = state.current();

        while (token && token.type === "comma") {
            token = state.next();
            let subNode = walk([...init, {...node, position : "expressions"}]);
            node.expressions.push(subNode);
            token = state.current();
        }

        let subSequenceExpression = node.expressions.find((node) => node.type === "SequenceExpression");
        if (subSequenceExpression) {
            node.expressions
                .filter((node) => node.type !== "SequenceExpression")
                .forEach((node) => subSequenceExpression.expressions.push(node))
            node.expressions = subSequenceExpression.expressions;
        }


        return node;
    }

    arrow(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "ArrowFunctionExpression",
            expression: true
        };

        if (arrowStack.length > 0){
            node.params = [...arrowStack]
        } else {
            node.params = [...stack]
        }

        stack.length = 0;

        token = state.next();

        node.body = walk([...init, {...node, position : "body"}]);

        return node;
    }

    if(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "IfStatement"
        };

        token = state.next();

        node.test = walk([...init, {...node, position : "test"}]);

        node.consequent = walk([...init, {...node, position : "consequent"}]);

        token = state.current();

        while (token && token.type === "semicolon") {
            token = state.next();
        }

        if (token && token.type === "else") {
            token = state.next();
            while (token && token.type === "semicolon") {
                token = state.next();
            }
            if (token && token.type) {
                node.alternate = walk([...init, {...node, position : "alternate"}]);
            }
        }

        return node;
    }

    switch(state, stack, walk, init, topLevel) {
        let token = state.current();
        let node = {
            type: "SwitchStatement",
            discriminant: null,
            cases: []
        };

        token = state.next({expected: ["leftRoundBracket"]});
        token = state.next();
        node.discriminant = walk([...init, {...node, position : "discriminant"}]);

        token = state.current({expected: ["rightRoundBracket"]});
        token = state.next({expected: ["leftCurlyBracket"]});

        token = state.next({expected: ["case"]});

        while (token && token.type !== "rightCurlyBracket") {
            let caseNode = {
                type: "SwitchCase",
                consequent: [],
                test: null
            }

            node.cases.push(caseNode);

            if (token && token.type === "default") {
                token = state.next({expected: ["colon"]});
            } else {
                token = state.next();
                caseNode.test = walk([...init, {...caseNode, position : "test"}]);
            }

            token = state.current({expected: ["colon"]});
            token = state.next();

            while (token && (token.type !== "case" && token.type !== "default" && token.type !== "rightCurlyBracket")) {
                caseNode.consequent.push(topLevel(caseNode));
                token = state.current();
            }
            token = state.current();
        }

        token = state.next();

        return node;
    }

    operation(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node;

        if (this.isUnaryPattern(init)) {
            node = {
                type: "UnaryExpression",
                operator: token.value,
                prefix : true
            };

            token = state.next();

            node.argument = walk([...init, {...node, position : "argument"}])

        } else {
            switch (token.value) {
                case "void" :
                case "typeof" :
                case "!" : {
                    node = {
                        type: "UnaryExpression",
                        operator: token.value,
                        prefix : true
                    };

                    token = state.next();

                    node.argument = walk([...init, {...node, position : "argument"}])
                }
                    break;
                case "++" :
                case "--" : {
                    if (this.topType(init) === "Identifier") {
                        node = {
                            type: "UpdateExpression",
                            operator: token.value,
                            argument: stack.pop(),
                            prefix: false
                        };

                        token = state.next();

                    } else {
                        node = {
                            type: "UpdateExpression",
                            operator: token.value,
                            prefix: true
                        };

                        token = state.next();

                        node.argument = walk([...init, {...node, position : "argument"}]);
                    }
                }
                    break;
                default : {
                    node = this.parseBinaryExpression(state, stack, walk, init, stack.pop(), 0)
                }
                    break;
            }
        }

        token = state.current();

        if (token) {
            if (this.isBinaryExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isConditionalExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isAssignmentExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isSequenceExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }
        }

        return node
    }

    point(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node;
        if (this.topType(init) === "MemberExpression") {
            node = stack.pop();
        } else {
            node = {
                type: "MemberExpression",
            };

            token = state.next({keyWords: false, nWhiteSpace : false});

            node.object = stack.pop();
            node.property = walk([...init, {...node, position : "property"}]);
            node.computed = node.property.type === "Literal"
            token = state.current();
        }

        while (token && token.type === "point") {
            token = state.next({keyWords : false});
            let temp = node;
            node = {
                type : "MemberExpression",
                object : temp,
            }
            node.property = walk([...init, {...node, position : "property"}]);
            token = state.current();
        }

        if (token) {
            if (this.isConditionalExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isCallExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isSequenceExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isMemberExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isAssignmentExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }

            if (this.isBinaryExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }
        }

        return node
    }

    conditional(state, stack, walk, init, topLevel) {
        let token = state.current();

        let node = {
            type: "ConditionalExpression",
            test: stack.pop()
        };

        token = state.next();

        node.consequent = walk([...init, {...node, position : "consequent"}]);

        token = state.current();

        if (token && token.type === "colon") {
            state.next();
            node.alternate = walk([...init, {...node, position : "alternate"}]);
        }

        if (token) {
            if (this.isSequenceExpression(token, init)) {
                stack.push(node);
                node = walk([...init, {...node, position : "end"}]);
            }
        }

        return node;
    }

    leftCurlyBracket(state, stack, walk, init, topLevel) {
        let token = state.current();

        if (!init[init.length - 1].parenthesis) {
            if (this.isBlockPattern(init)) {
                let node = {
                    type: "BlockStatement",
                    body: []
                };

                token = state.next();

                while (token && token.type === "semicolon") {
                    token = state.next();
                }

                while (token && token.type !== "rightCurlyBracket") {
                    node.body.push(topLevel(node));
                    token = state.current();
                }

                token = state.next();

                return node;
            }
        }

        if (this.isObjectPattern(init)) {
            let node = {
                type: (this.topType(init) === "ObjectPattern" || this.topType(init) === "VariableDeclarator" && ! init[init.length -1].id) ? "ObjectPattern" : "ObjectExpression",
                properties: []
            };

            token = state.next({keyWords : false});

            while (token && token.type !== "rightCurlyBracket") {
                let getter = false;
                let setter = false;
                let initMethod = false;
                if (token && (token.type === "operation" && token.value === "*")) {
                    initMethod = true
                    token = state.next({keyWords : false});
                }

                if (token.value === "get" || token.value === "set") {
                    let temp = token;
                    token = state.next({keyWords : false})
                    if (token && token.type === "property") {
                        getter = temp.value === "get"
                        setter = temp.value === "set"
                    }
                    if (token && (token.type === "colon" || token.type === "left")) {
                        token = state.previous({keyWords : false});
                    }
                }

                let key = walk([...init, {...node, position : "key"}]);
                token = state.current();
                if (token && token.type === "leftRoundBracket") {
                    let value = walk([...init, {...node, position : "key"}]);
                    node.properties.push({
                        type: "Property",
                        key: key,
                        value: value,
                        kind : getter ? "get" : "" || setter ? "set" : "",
                        init : initMethod,
                        method: ! (getter || setter)
                    });
                    token = state.current();
                    if (token && token.type === "comma") {
                        token = state.next({keyWords : false});
                    }
                } else if (token && (token.type === "comma" || token.type === "rightCurlyBracket")) {
                    node.properties.push({
                        type: "Property",
                        key: key,
                        value: key,
                        shortHand: true,
                        kind : "init"
                    })
                    if (token && token.type === "comma") {
                        token = state.next({keyWords : false});
                    }
                } else {
                    token = state.next();
                    let value = walk([...init, {...node, position : "value"}]);
                    node.properties.push({
                        type: "Property",
                        key: key,
                        value: value,
                        kind: "init"
                    });
                    token = state.current();
                    if (token && token.type === "comma") {
                        token = state.next({keyWords : false});
                    }
                }
            }

            token = state.next();

            if (token) {
                if (this.isBinaryExpression(token, init)) {
                    stack.push(node);
                    node = walk([...init, {...node, position : "end"}]);
                }

                if (this.isSequenceExpression(token, init)) {
                    stack.push(node);
                    node = walk([...init, {...node, position : "end"}]);
                }

                if (this.isAssignmentExpression(token, init)) {
                    stack.push(node);
                    node = walk([...init, {...node, position : "end"}]);
                }
            }

            return node;
        }

    }

    leftRoundBracket(state, stack, walk, init, topLevel) {
        if (this.isCallPattern(init)) {
            let top = stack.pop();

            let token = state.current();

            let node = {
                type: "CallExpression",
                arguments: [],
            };

            state.next();

            let callee = top;
            if (callee) {
                node.callee = callee
            }

            token = state.current();

            while (token && token.type !== "rightRoundBracket") {
                node.arguments.push(walk([...init, {...node, position : "arguments"}]));
                token = state.current();
                if (token && token.type === "comma") {
                    token = state.next();
                }
            }

            token = state.next();

            if (token) {
                if (this.isBinaryExpression(token, init)) {
                    stack.push(node);
                    node = walk([...init, {...node, position : "end"}]);
                }

                if (this.isConditionalExpression(token, init)) {
                    stack.push(node);
                    node = walk([...init, {...node, position : "end"}]);
                }

                if (this.isMemberExpression(token, init)) {
                    stack.push(node)
                    node = walk([...init, {...node, position : "end"}]);
                }

                if (this.isCallExpression(token, init)) {
                    stack.push(node);
                    node = walk([...init, {...node, position : "end"}]);
                }

                if (this.isSequenceExpression(token, init)) {
                    stack.push(node);
                    node = walk([...init, {...node, position : "end"}]);
                }
            }

            return node;
        } else if (this.isFunctionPattern(init)) {
            let token = state.current();

            let node = {
                type: "FunctionExpression",
                params: []
            }

            if (token && token.type !== "leftRoundBracket") {
                node.id = walk([...init, {...node, position : "id"}]);
            }

            token = state.next();

            while (token && token.type !== "rightRoundBracket") {
                node.params.push(walk([...init, {...node, position : "params"}]));
                token = state.current();
            }

            token = state.next();

            node.body = walk([...init, {...node, position : "body"}]);

            token = state.current();

            if (token) {
                if (this.isSequenceExpression(token, init)) {
                    stack.push(node);
                    node = walk([...init, {...node, position : "end"}]);
                }
            }

            return node;
        } else {
            let token = state.next();
            let node;
            while (token && token.type !== "rightRoundBracket") {
                node = walk([...init, {
                    ...init,
                    position : "parenthesis",
                    parenthesis: true
                }]);
                arrowStack.push(node);
                token = state.current();
                if (token && token.type === "comma") {
                    token = state.next();
                }
            }

            token = state.next();

            if (token && token.type === "arrow") {
                node = walk([...init, {...node, position : "arrow"}])
                arrowStack.length = 0;
            } else {
                arrowStack.length = 0;
                if (token) {
                    if (this.isMemberExpression(token, init)) {
                        stack.push(node);
                        node = walk([...init, {...node, position : "end"}]);
                    }

                    if (this.isConditionalExpression(token, init)) {
                        stack.push(node);
                        node = walk([...init, {...node, position : "end"}]);
                    }

                    if (this.isBinaryExpression(token, init)) {
                        stack.push(node);
                        node = walk([...init, {...node, position : "end"}]);
                    }

                    if (this.isCallExpression(token, init)) {
                        stack.push(node);
                        node = walk([...init, {...node, position : "end"}]);
                    }

                    if (this.isSequenceExpression(token, init)) {
                        stack.push(node);
                        node = walk([...init, {...node, position : "end"}]);
                    }

                    if (this.isAssignmentExpression(token, init)) {
                        stack.push(node);
                        node = walk([...init, {...node, position : "end"}]);
                    }
                }
            }

            return node;
        }
    }

    leftSquareBracket(state, stack, walk, init, topLevel) {
        let token = state.current();
        let top = stack.pop();
        if (this.isMemberPattern(top)) {

            let node;
            if (this.topType(init) === "MemberExpression") {
                node = top;
            } else {
                node = {
                    type: "MemberExpression"
                };

                token = state.next({keyWords: false});

                node.object = top;
                node.property = walk([...init, {...node, position : "property"}]);
                node.computed = node.property.type === "Literal"
                token = state.next();
            }


            while (token && token.type === "leftSquareBracket") {
                token = state.next();
                node = {
                    type : "MemberExpression",
                    object : node,
                };

                node.property = walk([...init, {...node, position : "property"}]);

                token = state.next();
            }

            if (token) {
                if (this.isCallExpression(token, init)) {
                    stack.push(node);
                    node = walk([...init, {...node, position : "end"}]);
                }

                if (this.isMemberExpression(token, init)) {
                    stack.push(node);
                    node = walk([...init, {...node, position : "end"}]);
                }
            }

            return  node;
        } else {
            let node = {
                type: "ArrayPattern",
                elements: []
            };

            token = state.next();

            while (token && token.type !== "rightSquareBracket") {
                node.elements.push(walk([...init, {...node, position : "elements"}]));
                token = state.current();
                if (token && token.type === "comma") {
                    token = state.next();
                }
            }

            token = state.next();

            if (token) {
                if (this.isSequenceExpression(token, init)) {
                    stack.push(node);
                    node = walk([...init, {...node, position : "end"}]);
                }
            }

            return node;
        }
    }
}

export function parser(expression, parsers = [new TopLevelParser(), new Parser()]) {
    let state = tokenizer(expression);

    let stack = [];

    let topLevelParsers = parsers.filter((parser) => parser instanceof TopLevelParser)
    let subParsers = parsers.filter((parser) => parser instanceof Parser)

    function topLevel() {
        let token = state.current();

        while (token && token.type === "semicolon") {
            token = state.next();
        }

        for (const topLevelParser of topLevelParsers) {
            let parserSegment = topLevelParser[token.type];
            if (parserSegment) {
                return parserSegment.call(topLevelParser, state, stack, walk);
            }
        }
        return topLevelParsers[0].default(state, stack, walk);
    }

    function walk(init, options) {
        let token = state.current();

        while (token && token.type === "semicolon") {
            token = state.next();
        }

        if (token) {
            for (const parser of subParsers) {
                let parserSegment = parser[token.type];

                if (parserSegment) {
                    return parserSegment.call(parser, state, stack, walk, init, topLevel);
                }
            }
            throw new Error(`State not available : ${token.type} at position "${state.capture()}"`)
        }
        throw new Error(`Token expected`)
    }

    let ast = [];

    let token = state.next();

    while (token !== null) {
        ast.push(topLevel());
        token = state.current()
    }

    if (stack.length > 0) {
        console.error(`Stack not empty. ${JSON.stringify(stack)}`);
    }

    return {
        type: "Program",
        body: ast
    }
}