export function walker(program, state, parent = []) {

    Object.assign(state, {
        findMemberAncestors(node) {
            let ancestors = [];
            let cursor = node;
            while (cursor.type === "MemberExpression" || cursor.type === "CallExpression") {
                if (cursor.type === "MemberExpression" && (cursor.object.type === "MemberExpression" || cursor.object.type === "CallExpression")) {
                    cursor = cursor.object;
                } else if (cursor.type === "CallExpression" && (cursor.callee.type === "MemberExpression" || cursor.callee.type === "CallExpression")) {
                    cursor = cursor.callee
                } else {
                    break;
                }
                ancestors.push(cursor)
            }
            return ancestors;
        }
    })

    function walk(node, parent, position) {
        let type = node.type;
        let goDeeper = true;
        if (state[type]) {
            goDeeper = state[type](node, parent, position);
        } else {
            let defaultElement = state["default"];
            if (defaultElement) {
                goDeeper = defaultElement(node, parent, position);
            }
        }

        if (goDeeper) {
            for (const [key, value] of Object.entries(node)) {
                if (value instanceof Array) {
                    for (const element of value) {
                        walk(element, [...parent, {node: node, property: key}]);
                    }
                } else if (value instanceof Object) {
                    walk(value, [...parent, {node: node, property: key}]);
                } else {
                    // Do Nothing
                }
            }
        }
    }

    if (program instanceof Array) {
        for (const element of program) {
            walk(element, Array.from(parent));
        }
    } else {
        walk(program, Array.from(parent));
    }


}