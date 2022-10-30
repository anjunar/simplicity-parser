function tabs(scope, closing) {
    let blackList = [
        "BlockStatement",
        "Property",
        "Program",
        "VariableDeclarator",
        "FunctionExpression",
        "MethodDefinition",
        "PropertyDefinition",
        "LabeledStatement",
        "ClassDeclaration",
        "NewExpression"
    ];

    let length = scope.filter(node => blackList.indexOf(node.type) === -1).length;
    if (closing) {
        length--
    }
    if (length < 0) {
        length = 0;
    }
    return "    ".repeat(length);
}

export class Generator {
    Program(node, walk, scope) {
        return node.body.map((segment) => walk(segment, [...scope, node])).join("\n")
    }

    ExpressionStatement(node, walk, scope) {
        return walk(node.expression, [...scope, node]) + ";";
    }

    SequenceExpression(node, walk, scope) {
        return node.expressions.map((expression) => walk(expression, [...scope, node])).join(", ")
    }

    Literal(node, walk, scope) {
        if (typeof node.value === "string") {
            return "'" + node.value + "'";
        }
        return node.value;
    }

    TemplateLiteral(node, walk, scope) {
        let result = "`"
        for (let i = 0; i < node.quasis.length; i++) {
            const quasi = node.quasis[i];
            const expression = node.expressions[i]
            result += walk(quasi, [...scope, node])
            if (expression) {
                result += "${ " + walk(expression, [...scope, node]) + " }"
            }
        }
        return result + "`";
    }

    TemplateElement(node, walk, scope) {
        return node.value
    }

    Identifier(node, walk, scope) {
        return node.name;
    }

    SpreadElement(node, walk, scope) {
        return "..." + walk(node.argument, [...scope, node]);
    }

    ReturnStatement(node, walk, scope) {
        return "return " + walk(node.argument, [...scope, node]);
    }

    ImportStatement(node, walk, scope) {
        if (node.specifiers.length > 0 && (node.specifiers[0].type === "ImportNamespaceSpecifier" || node.specifiers[0].type === "ImportDefaultSpecifier")) {
            return "import " + node.specifiers.map((specifier) => walk(specifier, [...scope, node])).join(", ") + " from " + walk(node.source, [...scope, node]);
        }
        return "import {" + node.specifiers.map((specifier) => walk(specifier, [...scope, node])).join(", ") + "}" + " from " + walk(node.source, [...scope, node]);
    }

    ImportDefaultSpecifier(node, walk, scope) {
        return walk(node.local, [...scope, node]);
    }

    ImportNamespaceSpecifier(node, walk, scope) {
        return "* as " + walk(node.local, [...scope, node]);
    }

    ImportSpecifier(node, walk, scope) {
        let result = "";
        result += walk(node.imported, [...scope, node]);
        if (node.imported !== node.local) {
            result += " as " + walk(node.local, [...scope, node]);
        }
        return result;
    }

    NewExpression(node, walk, scope) {
        let result = "new " + walk(node.callee, [...scope, node]);
        if (node.arguments.length > 0) {
            result += "( " + node.arguments.map(node => walk(node, [...scope, node])).join(", ") + " )"
        }
        return result
    }

    ThisExpression(node, walk, scope) {
        return "this"
    }

    VariableDeclaration(node, walk, scope) {
        let result = node.kind + " ";
        let declarations = node.declarations.map((declaration) => walk(declaration, [...scope, node])).join(", ");
        result += declarations
        let forScope = false;
        if (scope.length > 0) {
            forScope = scope[scope.length - 1].type.startsWith("For")
        }
        return result += forScope ? "" : ";";
    }

    VariableDeclarator(node, walk, scope) {
        let result = walk(node.id, [...scope, node]);
        if (node.init) {
            result += " = " + walk(node.init, [...scope, node]);
        }
        return result
    }

    AssignmentExpression(node, walk, scope) {
        return walk(node.left, [...scope, node]) + " " + node.operator + " " + walk(node.right, [...scope, node])
    }

    ClassDeclaration(node, walk, scope) {
        let result = "class "

        if (node.id) {
            result += walk(node.id, [...scope, node]);
        }

        if (node.superClass) {
            result += " extends " + walk(node.superClass, [...scope, node]);
        }

        result += walk(node.body, [...scope, node]);

        return result;
    }

    ClassBody(node, walk, scope) {
        return " {\n" + node.body.map((segment) => tabs(scope) + walk(segment, [...scope, node])).join("\n") + "\n" + tabs(scope, true) + "}"
    }

    ExportDefaultStatement(node, walk, scope) {
        return "export default " + walk(node.declaration, [...scope, node]);
    }

    ExportStatement(node, walk, scope) {
        return "export " + walk(node.declaration, [...scope, node]);
    }

    ExportNamedDeclaration(node, walk, scope) {
        return "export { " + node.specifiers.map((node) => walk(node, [...scope, node])) + " } from " + walk(node.source, [...scope, node])
    }

    ExportSpecifier(node, walk, scope) {
        if (node.local.value === node.exported.value) {
            return walk(node.local, [...scope, node])
        }
        return walk(node.local, [...scope, node]) + " as " + walk(node.exported, [...scope, node])
    }

    PropertyDefinition(node, walk, scope) {
        let result = "";
        if (node.static) {
            result += "static "
        }
        result += walk(node.key, [...scope, node]) + " = " + walk(node.value, [...scope, node]) + ";";
        return result
    }

    MethodDefinition(node, walk, scope) {
        let functionExpression = node.value;
        let result = "";
        if (node.static) {
            result += "static ";
        }
        if (node.kind === "get") {
            result += "get "
        }
        if (node.kind === "set") {
            result += "set "
        }
        result += walk(node.key, [...scope, node]) + "(" + functionExpression.params.map((param) => walk(param, [...scope, node])).join(", ") + ")" + walk(functionExpression.body, [...scope, node]);
        return result;
    }

    FunctionExpression(node, walk, scope) {
        let result = "";
        if (node.async) {
            result += "async "
        }

        let params = node.params.map(param => walk(param, [...scope, node])).join(", ")

        result += "function " + (node.id ? walk(node.id, [...scope, node]) : "") + "(" + params + ")"

        if (node.body) {
            result += walk(node.body, [...scope, node])
        }

        return result;
    }

    FunctionDeclaration(node, walk, scope) {
        let result = "";
        if (node.async) {
            result += "async "
        }

        let params = node.params.map(param => walk(param, [...scope, node])).join(", ")

        result += "function " + walk(node.id, [...scope, node]) + "(" + params + ")"

        if (node.body) {
            result += walk(node.body, [...scope, node])
        }

        return result;
    }

    ArrowFunctionExpression(node, walk, scope) {
        return "(" + node.params.map(param => walk(param, [...scope, node])).join(", ") + ") =>" + walk(node.body, [...scope, node])
    }

    YieldExpression(node, walk, scope) {
        let result = "yield "
        if (node.delegate) {
            result += "*"
        }
        if (node.argument) {
            return result += walk(node.argument, [...scope, node]);
        }
        return result;
    }

    ForStatement(node, walk, scope) {
        let result = "for ("
        if (node.init) {
            result += walk(node.init, [...scope, node]);
        }
        result += "; ";
        if (node.test) {
            result += walk(node.test, [...scope, node])
        }
        result += "; "
        if (node.update) {
            result += walk(node.update, [...scope, node])
        }
        result += ") ";
        if (node.body) {
            result += walk(node.body, [...scope, node])
        }
        return result
    }

    ForOfStatement(node, walk, scope) {
        let result = "for ";
        if (node.await) {
            result += "await "
        }
        result += "(" + walk(node.left, [...scope, node]) + " of " + walk(node.right, [...scope, node]) + ")"

        if (node.body) {
            result += walk(node.body, [...scope, node])
        }

        return result;
    }

    ForInStatement(node, walk, scope) {
        let result = "for ";
        if (node.await) {
            result += "await "
        }
        result += "(" + walk(node.left, [...scope, node]) + " in " + walk(node.right, [...scope, node]) + ")"

        if (node.body) {
            result += walk(node.body, [...scope, node])
        }

        return  result;
    }

    DoWhileStatement(node, walk, scope) {
        let result = "do " + walk(node.body, [...scope, node]);
        if (node.test) {
            result += " while (" + walk(node.test, [...scope, node]) + ")"
        }
        return result;
    }

    WhileStatement(node, walk, scope) {
        let result = "while (" + walk(node.test, [...scope, node]) + ")";
        if (node.body) {
            result += walk(node.body, [...scope, node])
        }
        return result;
    }

    ContinueStatement(node, walk, scope) {
        let result = "continue ";
        if (node.label) {
            result += walk(node.label, [...scope, node])
        }
        return result
    }

    BreakStatement(node, walk, scope) {
        let result = "break ";
        if (node.label) {
            result += walk(node.label, [...scope, node])
        }
        return result
    }

    LabeledStatement(node, walk, scope) {
        return walk(node.label, [...scope, node]) + ": " + walk(node.body, [...scope, node])
    }

    IfStatement(node, walk, scope) {
        let result = "if (" + walk(node.test, [...scope, node]) + ")" + walk(node.consequent, [...scope, node])
        if (node.alternate) {
            result += " else" + walk(node.alternate, [...scope, node])
        }
        return result;
    }

    SwitchStatement(node, walk, scope) {
        let result = "switch (" + walk(node.discriminant, [...scope, node]) + ") {"
        result += node.cases.map((caseBlock) => walk(caseBlock, [...scope, node])).join("\n")
        result += "}"
        return result;
    }

    SwitchCase(node, walk, scope) {
        let result = "";
        if (node.test) {
            result += "case " + walk(node.test, [...scope, node]) + " : ";
        } else {
            result += "default : "
        }
        result += node.consequent.map((block) => walk(block, [...scope, node])).join("\n")
        return result;
    }

    UpdateExpression(node, walk, scope) {
        if (node.prefix) {
            return node.operator + walk(node.argument, [...scope, node]);
        } else {
            return walk(node.argument, [...scope, node]) + node.operator;
        }
    }

    UnaryExpression(node, walk, scope) {
        return node.operator + " " + walk(node.argument, [...scope, node]);
    }

    BinaryExpression(node, walk, scope) {
        return "( " + walk(node.left, [...scope, node]) + " " + node.operator + " " + walk(node.right, [...scope, node]) + " )";
    }

    LogicalExpression(node, walk, scope) {
        return "( " + walk(node.left, [...scope, node]) + " " + node.operator + " " + walk(node.right, [...scope, node]) + " )";
    }

    MemberExpression(node, walk, scope) {
        if (node.property.type === "Identifier" || node.property.type === "MemberExpression" || node.property.type === "CallExpression") {
            return walk(node.object, [...scope, node]) + "." + walk(node.property, [...scope, node])
        }
        return walk(node.object, [...scope, node]) + "[" + walk(node.property, [...scope, node]) + "]"
    }

    ConditionalExpression(node, walk, scope) {
        let result = walk(node.test, [...scope, node]) + " ? " + walk(node.consequent, [...scope, node]);
        if (node.alternate) {
            result += " : " + walk(node.alternate, [...scope, node]);
        }
        return result;
    }

    BlockStatement(node, walk, scope) {
        if (node.body.length === 0) {
            return " {}"
        }
        return " {\n" + node.body.map((segment) => tabs(scope) + walk(segment, [...scope, node])).join("\n") + "\n" + tabs(scope, true) + "}"
    }

    Property(node, walk, scope) {
        if (node.method) {
            let functionExpression = node.value;
            return walk(node.key, [...scope, node]) + "(" + functionExpression.params.map((argument) => walk(argument, [...scope, node])) + ")" + walk(functionExpression.body, [...scope, node]);
        } else if (node.shortHand) {
            return walk(node.key, [...scope, node]);
        } else {
            if (node.kind === "get" || node.kind === "set") {
                let functionExpression = node.value;
                return node.kind + " " + walk(node.key, [...scope, node]) + "(" + functionExpression.params.map((argument) => walk(argument, [...scope, node])) + ")" + walk(functionExpression.body, [...scope, node]);
            }
            return walk(node.key, [...scope, node]) + " : " + walk(node.value, [...scope, node]);
        }
    }

    ObjectExpression(node, walk, scope) {
        if (node.properties.length === 0) {
            return " {}"
        }
        return "{ " + node.properties.map((param) => "\n" + tabs(scope) + walk(param, [...scope, node])).join(", ") + "\n" + tabs(scope, true) + "}"
    }

    ObjectPattern(node, walk, scope) {
        if (node.properties.length === 0) {
            return " {}"
        }
        return "{ " + node.properties.map((param) => walk(param, [...scope, node])).join(", ") + tabs(scope, true) + "}"
    }

    CallExpression(node, walk, scope) {
        return walk(node.callee, [...scope, node]) + "(" + node.arguments.map((argument) => walk(argument, [...scope, node])).join(", ") + ")";
    }

    ArrayPattern(node, walk, scope) {
        return "[" + node.elements.map((element) => walk(element, [...scope, node])).join(", ") + "]";
    }
}

export function generator(ast, generators = [new Generator()]) {

    function walk(node, scope) {
        for (const generator of generators) {
            let element = generator[node.type];
            if (element) {
                return element(node, walk, scope);
            }
        }
    }

    return walk(ast, []);
}