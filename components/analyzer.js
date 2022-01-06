const { console_colors } = require("node-console-colors");
const cc = require("node-console-colors");
const io = require("../util/io");
const TreeNode = require("./treenode");

let showError,
    return_found = false;
let global_location = 0;
let local_location = -4;
let para_location = 0;
let func_num = 0;
let errors = 0;

let scopes = [{ local_location_using: 0 }];
let _sc = [];
let currScope = 0;
function push_scope(name) {
    scopes.push({ local_location_using: 0 });
    currScope++;
    if (name) _sc.push(name);
}

const typeTable = { global: {} };
const symbTable = { global: {} };

function countSiblings(node) {
    let arr = [];
    while (node) {
        arr.push(node.isArray ? "array" : node.nodetype);
        node = node.sibling;
    }
    return arr;
}

function lookup(node, el, table) {
    while (node) {
        if (table[node.scope].hasOwnProperty(el)) return table[node.scope][el];
        node = node.par;
    }
    return undefined;
}

function typeResolution(node, par, scope = "global") {
    let tree = node;
    let parent = par ? par : undefined;

    while (tree) {
        let temp,
            lineno = tree.lineno;
        let type, identifier;

        tree.scope = scope;
        tree.par = parent ? { scope: parent.scope, par: parent.par } : undefined;

        switch (tree.name) {
            case "VAR_DECL":
                type = tree[tree.name].children[0]["TYPE"].type;
                identifier = tree[tree.name].children[1]["IDENTIFIER"].name;
                tree[tree.name].children[1].nodetype = type;
                if (
                    typeTable.hasOwnProperty(scope) &&
                    !typeTable[scope].hasOwnProperty(identifier)
                ) {
                    typeTable[scope][identifier] = {
                        identifier,
                        type,
                        kind: "variable",
                        isArray: false,
                        lineno,
                        scope,
                    };
                }

                tree.size = 1;
                tree.nodetype = type;
                tree.identifier = identifier;

                tree.symbol = typeTable[scope][identifier];

                break;

            case "ARR_DECL":
                type = tree[tree.name].children[0]["TYPE"].type;
                identifier = tree[tree.name].children[1]["IDENTIFIER"].name;
                const length = tree[tree.name].children[2]["CONSTANT"].value;
                tree[tree.name].children[2].isStatic = true;
                tree[tree.name].children[1].nodetype = type;

                tree.size = length;
                tree.nodetype = type;
                tree.identifier = identifier;

                if (
                    typeTable.hasOwnProperty(scope) &&
                    !typeTable.hasOwnProperty(identifier)
                )
                    typeTable[scope][identifier] = {
                        identifier,
                        type,
                        kind: "variable",
                        lineno,
                        length,
                        scope,
                        isArray: true,
                    };

                tree.symbol = typeTable[scope][identifier];

                break;
            case "PARAM_VAR":
                para_location += 4;
                type = tree[tree.name].children[0]["TYPE"].type;
                identifier = tree[tree.name].children[1]["IDENTIFIER"].name;
                if (
                    typeTable.hasOwnProperty(scope) &&
                    !typeTable.hasOwnProperty(identifier)
                )
                    typeTable[scope][identifier] = {
                        identifier,
                        type,
                        kind: "variable",
                        lineno,
                        scope,
                        isParam: true,
                        isArray: false,
                    };
                tree.nodetype = tree[tree.name].children[0]["TYPE"].type;
                tree.identifier = identifier;
                tree.scope = scope;
                tree.symbol = typeTable[scope][identifier];

                break;
            case "PARAM_ARR":
                type = tree[tree.name].children[0]["TYPE"].type;
                identifier = tree[tree.name].children[1]["IDENTIFIER"].name;

                tree[tree.name].children[1].nodetype = type;
                if (
                    typeTable.hasOwnProperty(scope) &&
                    !typeTable.hasOwnProperty(identifier)
                )
                    typeTable[scope][identifier] = {
                        identifier,
                        type,
                        kind: "variable",
                        lineno,
                        scope,
                        isParam: true,
                        isArray: true,
                    };
                tree.nodetype = "array";
                tree.scope = scope;
                tree.identifier = identifier;

                tree.symbol = typeTable[scope][identifier];

                break;
            case "ARR_VAR":
                tree[tree.name].children[1].isIndex = true;
                identifier = lookup(
                    tree,
                    tree[tree.name].children[0]["IDENTIFIER"].name,
                    typeTable
                );

                if (identifier) {
                    tree.symbol = identifier;
                    if (identifier.isParam) tree.isParam = true;
                    tree.nodetype = identifier.type;
                    tree.scope = identifier.scope;
                    tree.identifier = identifier.identifier;
                }

                break;
            case "FUNC_DECL":
                identifier = tree[tree.name].name;
                tree.no_parameters = countSiblings(tree[tree.name].children[1]).length;
                type = tree[tree.name].children[0]["TYPE"].type;

                tree.identifier = identifier;

                if (!typeTable.hasOwnProperty(identifier)) {
                    typeTable[identifier] = {};
                    typeTable["global"][identifier] = {
                        identifier,
                        type,
                        kind: "function",
                        lineno,
                        location: func_num,
                        scope,
                        parameters: tree.no_parameters,
                    };
                }

                scope = identifier;
                break;
            case "CONSTANT":
                tree.value = tree[tree.name].value;
                tree.nodetype = "int";
                break;
            case "IDENTIFIER":
                temp = lookup(tree, tree["IDENTIFIER"].name, typeTable);
                if (temp) {
                    tree.scope = temp.scope;
                    tree.symbol = temp;
                    tree.identifier = tree["IDENTIFIER"].name;
                    tree.location = temp.location;

                    if (temp.isParam) tree.isParam = true;
                    if (temp.type) tree.nodetype = temp.isArray ? "array" : temp.type;
                    if (temp.isArray) tree.isArray = true;
                    if (temp.isIndex) tree.isIndex = true;
                    if (temp.isStatic) tree.isStatic = true;
                } else {
                    tree.nodetype = "undefined";
                }
                break;
            case "COMPOUND_STMT":
                if (parent && parent.name == "FUNC_DECL") {
                    tree.isFuncCompound = true;
                }
                break;
            case "CALL":
                temp = lookup(
                    tree,
                    tree[tree.name].children[0]["IDENTIFIER"].name,
                    typeTable
                );
                if (temp && temp.kind === "function") {
                    tree.identifier = tree[tree.name].children[0]["IDENTIFIER"].name;
                    tree.nodetype = temp.type;
                } else {
                    tree.nodetype = undefined;
                }
                break;
        }

        if (tree[tree.name].children.length > 0) {
            for (const child of tree[tree.name].children) {
                typeResolution(child, tree, scope);
            }
        }

        if (/\*|\+|\-|\/|<=|<|>|>=|==|!=/.test(tree.name)) {
            switch (tree.name) {
                case "*":
                case "+":
                case "-":
                case "/":
                    tree.nodetype = "int";
                    break;
                default:
                    tree.nodetype = "bool";
                    break;
            }
        } else if (tree.name == "ASSIGN") {
            tree.nodetype = tree[tree.name].children[0].nodetype;
        }

        if (tree.name === "FUNC_DECL") {
            scope = "global";
        }

        tree = tree.sibling;
    }
}

function semanticParsing(node, par, scope = "global") {
    let tree, parent;
    tree = node;
    parent = par ? par : undefined;

    while (tree) {
        let tmp, type, func;
        const lineno = tree.lineno;

        switch (tree.name) {
            case "VAR_DECL":
                type = tree[tree.name].children[0]["TYPE"].type;
                identifier = tree[tree.name].children[1]["IDENTIFIER"].name;
                tree[tree.name].children[1].nodetype = type;
                if (
                    symbTable.hasOwnProperty(scope) &&
                    !symbTable[scope].hasOwnProperty(identifier)
                ) {
                    symbTable[scope][identifier] = {
                        identifier,
                        type,
                        kind: "variable",
                        isArray: false,
                        lineno,
                        scope,
                    };
                } else {
                    errors++;
                    showError(
                        identifier,
                        lineno,
                        `Variable ${identifier} has already been declared in the present scope at line ${symbTable[scope][identifier].lineno
                        } (line ${lineno + 1})`,
                        true
                    );
                }
                break;
            case "ARR_DECL":
                type = tree[tree.name].children[0]["TYPE"].type;
                identifier = tree[tree.name].children[1]["IDENTIFIER"].name;
                const length = tree[tree.name].children[2]["CONSTANT"].value;

                if (
                    symbTable.hasOwnProperty(scope) &&
                    !symbTable[scope].hasOwnProperty(identifier)
                ) {
                    symbTable[scope][identifier] = {
                        identifier,
                        type,
                        kind: "variable",
                        lineno,
                        length,
                        scope,
                        isArray: true,
                    };
                } else {
                    errors++;
                    showError(
                        identifier,
                        lineno,
                        `Variable ${identifier} has already been declared in the present scope at line ${symbTable[scope][identifier].lineno
                        } (line ${lineno + 1})`,
                        true
                    );
                }
                break;
            case "PARAM_VAR":
                type = tree[tree.name].children[0]["TYPE"].type;
                identifier = tree[tree.name].children[1]["IDENTIFIER"].name;
                if (
                    symbTable.hasOwnProperty(scope) &&
                    !symbTable[scope].hasOwnProperty(identifier)
                ) {
                    symbTable[scope][identifier] = {
                        identifier,
                        type,
                        kind: "variable",
                        lineno,
                        scope,
                        isArray: false,
                    };
                    tree.nodetype = tree[tree.name].children[0]["TYPE"].type;
                } else {
                    errors++;
                    showError(
                        identifier,
                        lineno,
                        `'${identifier}' has already been declared as a parameter of function ${scope} (line ${lineno + 1
                        })`,
                        true
                    );
                }
                break;
            case "PARAM_ARR":
                type = tree[tree.name].children[0]["TYPE"].type;
                identifier = tree[tree.name].children[1]["IDENTIFIER"].name;
                tree[tree.name].children[1].nodetype = type;
                if (
                    symbTable.hasOwnProperty(scope) &&
                    !symbTable[scope].hasOwnProperty(identifier)
                ) {
                    symbTable[scope][identifier] = {
                        identifier,
                        type,
                        kind: "variable",
                        lineno,
                        scope,
                        isArray: true,
                    };

                    tree.nodetype = "array";
                } else {
                    errors++;
                    showError(
                        identifier,
                        lineno,
                        `'${identifier}' has already been declared as a parameter of function ${scope} (line ${lineno + 1
                        })`,
                        true
                    );
                }
                break;
            case "ARR_VAR":
                tree[tree.name].children[1].isIndex = true;
                identifier = lookup(
                    tree,
                    tree[tree.name].children[0]["IDENTIFIER"].name,
                    symbTable
                );

                tree.nodetype = identifier?.type;
                type = tree[tree.name].children[1].nodetype;

                if (type !== "int") {
                    errors++;
                    showError(
                        "[",
                        lineno,
                        `Array indexes must be integers (line ${lineno + 1})`,
                        true
                    );
                }
                break;
            case "FUNC_DECL":
                identifier = tree[tree.name].name;
                type = tree[tree.name].children[0]["TYPE"].type;
                if (!symbTable.hasOwnProperty(identifier)) {
                    symbTable[identifier] = {};
                    symbTable["global"][identifier] = {
                        identifier,
                        type,
                        kind: "function",
                        lineno,
                        scope,
                        siblings: countSiblings(tree[tree.name].children[1]),
                    };
                } else {
                    errors++;
                    showError(
                        identifier,
                        lineno,
                        `Function '${identifier}' already declared at line ${symbTable[scope][identifier].lineno}`,
                        true
                    );
                }

                scope = identifier;
                break;
            case "SELECT_STMT":
                type = tree[tree.name].children[0].nodetype;
                if (type != "bool") {
                    errors++;
                    showError(
                        identifier,
                        lineno,
                        `Expecting boolean test condition in if statement but got type ${type} (line ${lineno + 1
                        })`,
                        true
                    );
                }
                break;
            case "ITERATION_STMT":
                type = tree[tree.name].children[0].nodetype;
                if (type != "bool") {
                    errors++;
                    showError(
                        "(",
                        lineno,
                        `Expecting boolean test condition in while statement but got type ${type} (line ${lineno + 1
                        })`,
                        true
                    );
                }
                break;
            case "RETURN_STMT":
                return_found = true;
                type = tree[tree.name].children[0].nodetype;
                if (scope == "global") {
                    errors++;
                    showError(
                        "return",
                        lineno,
                        `Cannot return from global scope (line ${lineno + 1})`,
                        true
                    );
                } else {
                    type2 = symbTable["global"][scope].type;
                    if (type2 === "void") {
                        errors++;
                        showError(
                            "return",
                            lineno,
                            `Cannot return from void function ${scope} (line ${lineno + 1})`,
                            true
                        );
                    } else if (type !== type2) {
                        errors++;
                        showError(
                            "return",
                            lineno,
                            `Function ${scope} was expecting to return type ${type2}, but return was of type ${type} (line ${lineno + 1
                            })`,
                            true
                        );
                    }
                }
                break;
            case "IDENTIFIER":
                temp = lookup(tree, tree["IDENTIFIER"].name, symbTable);
                if (temp) {
                    if (temp.type) tree.nodetype = temp.isArray ? "array" : temp.type;
                    if (temp.isArray) tree.isArray = true;
                    if (temp.isIndex) tree.isIndex = true;
                    if (temp.isStatic) tree.isStatic = true;
                } else {
                    errors++;
                    showError(
                        tree["IDENTIFIER"].name,
                        lineno,
                        `Symbol ${tree["IDENTIFIER"].name} is not defined (line ${lineno + 1
                        })`,
                        true
                    );
                }
                break;
            case "ASSIGN":
                // console.log(tree[tree.name].children[0].name)
                // if (tree[tree.name].children[0].name === "ARR_VAR") {
                // temp = tree[tree.name].children[1];
                // console.log(temp)
                // }
                type = tree[tree.name].children[0].nodetype;
                type2 = tree[tree.name].children[1].nodetype;
                if (type && type2 && type != type2) {
                    errors++;
                    showError(
                        "=",
                        lineno,
                        `Operands must be of the same type (line ${lineno + 1})`,
                        true
                    );
                }
                break;
            case "+":
            case "*":
            case "-":
            case "/":
                type = tree[tree.name].children[0].nodetype;
                type2 = tree[tree.name].children[1].nodetype;
                if (type && type2 && type != type2) {
                    errors++;
                    showError(
                        tree.name,
                        lineno,
                        `Operands must be of the same type (line ${lineno + 1
                        }), but operands are of types ${type} and ${type2}`,
                        true
                    );
                }
                break;
            case "CALL":
                identifier = tree[tree.name].children[0]["IDENTIFIER"].name;
                temp = lookup(
                    tree,
                    tree[tree.name].children[0]["IDENTIFIER"].name,
                    symbTable
                );
                if (!temp) {
                    errors++;
                    showError(
                        tree.name,
                        lineno,
                        `Function with name ${identifier} is not defined (line ${lineno})`,
                        true
                    );
                } else {
                    if (temp.kind != "function") {
                        errors++;
                        showError(
                            tree.name,
                            lineno,
                            `Invalid function call, ${identifier} is not a function (line ${lineno})`,
                            true
                        );
                    } else {
                        // countSiblings(tree[tree.name].children[0])
                        const parameters = symbTable["global"][identifier].siblings;
                        const bparameters = countSiblings(tree[tree.name].children[1]);

                        // console.log(bp       arameters);
                        if (parameters.length > bparameters.length) {
                            errors++;
                            showError(
                                tree.name,
                                lineno,
                                `Too few arguments to function call, expected ${parameters.length}, have ${bparameters.length} (line ${lineno})`,
                                true
                            );
                        } else if (parameters.length < bparameters.length) {
                            errors++;
                            showError(
                                tree.name,
                                lineno,
                                `Too much arguments to function call, expected ${parameters.length}, have ${bparameters.length} (line ${lineno})`,
                                true
                            );
                        } else {
                            for (let i = 0; i < parameters.length; i++) {
                                if (parameters[i] != bparameters[i]) {
                                    errors++;
                                    showError(
                                        identifier,
                                        lineno,
                                        `Expecting ${parameters[i]} in parameter ${i + 1
                                        } of call to ${identifier}, but got ${bparameters[i]
                                        } (line ${lineno})`,
                                        true
                                    );
                                }
                            }
                        }
                    }
                }
                break;
            case "==":
            case "!=":
                type = tree[tree.name].children[0].nodetype;
                type2 = tree[tree.name].children[1].nodetype;
                if (type && type2 && type != type2) {
                    errors++;
                    showError(
                        tree.name,
                        lineno,
                        `Operands must be of the same type (line ${lineno})`,
                        true
                    );
                }
                break;
            case ">=":
            case ">":
            case "<=":
            case "<":
                type = tree[tree.name].children[0].nodetype;
                type2 = tree[tree.name].children[1].nodetype;
                if (type && type2 && type != type2) {
                    errors++;
                    showError(
                        "",
                        lineno,
                        `Operands must be of the same type (line ${lineno})`,
                        true
                    );
                } else if (type === "array" || type2 === "array") {
                    errors++;
                    showError(
                        "",
                        lineno,
                        `Operands cannot be arrays (line ${lineno})`,
                        true
                    );
                }
                break;
        }

        if (tree[tree.name].children.length > 0) {
            for (let i = 0; i < tree[tree.name].children.length; i++) {
                semanticParsing(tree[tree.name].children[i], tree, scope);
            }
        }

        if (
            (tree.name === "COMPOUND_STMT" && !tree.isFuncCompound) ||
            tree.name === "FUNC_DECL"
        ) {
            // new scope
            scope = "global";
        }

        if (tree.name === "FUNC_DECL" && lineno > -1) {
            // console.log(tree[tree.name].children)
            if (
                symbTable["global"][tree[tree.name].name].type != "void" &&
                !return_found
            ) {
                errors++;
                showError(
                    "",
                    lineno,
                    `Expecting to return type ${symbTable["global"][tree[tree.name].name].type
                    }, but function ${tree[tree.name].name
                    } has no return statement (line ${lineno})`,
                    true
                );
            }
        }
        tree_type_str = tree.nodetype;
        tree = tree.sibling;
    }
}

module.exports = function (tree, _showError) {
    showError = _showError;

    const input = io({ ...tree["Program"].children[0] });
    tree["Program"].children[0] = input;

    typeResolution(tree);
    semanticParsing(tree);

    return [tree["Program"].children[0], errors];
};
