const typeTable = {global: {}}
const symbTable = {global: {}}

function countSiblings(node) {
    let arr = []
    while (node) {
        // console.log(node);
        arr.push(node.nodetype);
        node = node.sibling;
    }
    return arr;
}

function checkArgTypes(node) {

}

function typeChecking(par, node, scope = "global") {
    let tree = node;
    let parent = par ? par : tree;

    while (tree) {
        let temp;
        let lineno = tree.lineno;
        let type, identifier, type2;
        switch (tree.name) {
            case 'VAR_DECL':
                type = tree[tree.name].children[0]['TYPE'].type;
                identifier = tree[tree.name].children[1]['IDENTIFIER'].name;
                tree[tree.name].children[1].nodetype = type;
                if (typeTable.hasOwnProperty(scope) && !typeTable[scope].hasOwnProperty(identifier)) typeTable[scope][identifier] = {
                    identifier,
                    type,
                    kind: "variable",
                    isArray: false,
                    lineno,
                    scope
                }
                break;
            case 'ARR_DECL':
                type = tree[tree.name].children[0]['TYPE'].type;
                identifier = tree[tree.name].children[1]['IDENTIFIER'].name;
                const length = tree[tree.name].children[2]["CONSTANT"].value;
                tree[tree.name].children[2].isStatic = true;
                tree[tree.name].children[1].nodetype = type;

                if (typeTable.hasOwnProperty(scope) && !typeTable.hasOwnProperty(identifier)) typeTable[scope][identifier] = {
                    identifier,
                    type,
                    kind: "variable",
                    lineno,
                    length,
                    scope,
                    isArray: true
                }
                break;
            case 'PARAM_VAR':
                type = tree[tree.name].children[0]['TYPE'].type;
                identifier = tree[tree.name].children[1]['IDENTIFIER'].name;
                if (typeTable.hasOwnProperty(scope) && !typeTable.hasOwnProperty(identifier)) typeTable[scope][identifier] = {
                    identifier,
                    type,
                    kind: "variable",
                    lineno,
                    scope,
                    isArray: false
                }
                tree.nodetype = tree[tree.name].children[0]["TYPE"].type;
                break;
            case 'PARAM_ARR':
                type = tree[tree.name].children[0]['TYPE'].type;
                identifier = tree[tree.name].children[1]['IDENTIFIER'].name;
                tree[tree.name].children[1].nodetype = type;
                // console.log(tree[tree.name].children[1])
                if (typeTable.hasOwnProperty(scope) && !typeTable.hasOwnProperty(identifier)) typeTable[scope][identifier] = {
                    identifier,
                    type,
                    kind: "variable",
                    lineno,
                    scope,
                    isArray: true
                }
                tree.nodetype = "array";
                break;
            case 'ARR_VAR':
                tree[tree.name].children[1].isIndex = true;
                identifier = typeTable[scope][tree[tree.name].children[0]["IDENTIFIER"].name].type;
                // console.log((tree[tree.name].children[1].name));
                if (typeTable.hasOwnProperty(scope)  && identifier) {
                    tree.nodetype = identifier;
                }
                break;
            case "FUNC_DECL":
                type = tree[tree.name].children[0]['TYPE'].type;
                identifier = tree[tree.name].name;
                if (!typeTable.hasOwnProperty(identifier) ){
                    typeTable[identifier] = {}
                    typeTable["global"][identifier] = {
                        identifier,
                        type,
                        kind: "function",
                        lineno,
                        scope,
                        siblings: countSiblings(tree[tree.name].children[1])
                    }
                }
                scope = identifier;
                break;
            case "CONSTANT":
                    tree.nodetype = "int";
                    break;
            case 'IDENTIFIER':
                if (typeTable.hasOwnProperty(scope) && typeTable[scope].hasOwnProperty(tree["IDENTIFIER"].name)) {
                    temp = typeTable[scope][tree["IDENTIFIER"].name];
                    if (temp.type) tree.nodetype = temp.isArray ? "array" : temp.type;
                    if (temp.isArray) tree.isArray = true;
                    if (temp.isIndex) tree.isIndex = true;
                    if (temp.isStatic) tree.isStatic = true;
                } else if (scope != "global" && typeTable["global"].hasOwnProperty(tree["IDENTIFIER"].name)) {
                    tree.nodetype = typeTable["global"][tree["IDENTIFIER"].name].type;
                } else {
                    // console.log(typeTable);
                    // tree.nodetype = "undefined";
                }
                break;
            case 'COMPOUND_STMT':
                if (parent.name != "FUNC_DECL") {
                    tree.isFuncCompound = true;
                }
                break;
            case 'CALL':
                if (typeTable.hasOwnProperty(scope)  && typeTable[scope].hasOwnProperty(tree[tree.name].children[0]["IDENTIFIER"].name) && typeTable[scope][tree[tree.name].children[0]["IDENTIFIER"].name].type === "function") {
                    tree.nodetype = typeTable[scope][tree[tree.name].children[0]["IDENTIFIER"].name].type;
                } else {
                    tree.nodetype = undefined;
                }
                break;
        }


        if (tree[tree.name].children.length > 0) {
            for (const child of tree[tree.name].children) {
                typeChecking(tree, child, scope)
            }
        }

        if ((tree.name === "COMPOUND_STMT" && parent.name != "FUNC_DECL") || tree.name === "FUNC_DECL") { // new scope
            scope = "global";
        } else if (/\*|\+|\-|\/|<=|<|>|>=|==|!=/.test(tree.name)) { // have to include relop I think
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
        
        tree = tree.sibling;
    }
}

errors = 0;
loopDeth = [];

function treeParse(par, node, scope = "global") {
    let tree, parent;
    tree = node;
    parent = par ? par : tree;

    while (tree) {
        let tmp, type, func;
        const lineno = tree.lineno;

        let lhs, rhs;
        let child0_sval, child1_sval;
        
        if (tree[tree.name].children.length > 0) {
            lhs = tree[tree.name].children[0].nodetype;
            child0_sval = tree[tree.name].children[0].name;
        }

        if (tree[tree.name].children.length > 1) {
            rhs = tree[tree.name].children[1].nodetype;
            child1_sval = tree[tree.name].children[1].name;
        }

        switch (tree.name) {
            case "VAR_DECL":
                type = tree[tree.name].children[0]['TYPE'].type;
                identifier = tree[tree.name].children[1]['IDENTIFIER'].name;
                tree[tree.name].children[1].nodetype = type;
                if (symbTable.hasOwnProperty(scope) && !symbTable[scope].hasOwnProperty(identifier)) { 
                    symbTable[scope][identifier] = {
                        identifier,
                        type,
                        kind: "variable",
                        isArray: false,
                        lineno,
                        scope
                    }
                } else {
                    errors++;
                    showError(identifier, lineno , `Variable ${identifier} has already been declared in the present scope at line ${symbTable[scope][identifier].lineno} (line ${lineno+1})`, true);
                }
                break;
            case 'ARR_DECL':
                type = tree[tree.name].children[0]['TYPE'].type;
                identifier = tree[tree.name].children[1]['IDENTIFIER'].name;
                const length = tree[tree.name].children[2]["CONSTANT"].value;

                if (symbTable.hasOwnProperty(scope) && !symbTable[scope].hasOwnProperty(identifier)) {
                    symbTable[scope][identifier] = {
                        identifier,
                        type,
                        kind: "variable",
                        lineno,
                        length,
                        scope,
                        isArray: true
                    }
                } else {
                    errors++;
                    showError(identifier, lineno , `Variable ${identifier} has already been declared in the present scope at line ${symbTable[scope][identifier].lineno} (line ${lineno+1})`, true);
                }
                break;
            case 'PARAM_VAR':
                type = tree[tree.name].children[0]['TYPE'].type;
                identifier = tree[tree.name].children[1]['IDENTIFIER'].name;
                if (symbTable.hasOwnProperty(scope) && !symbTable[scope].hasOwnProperty(identifier)) {
                    symbTable[scope][identifier] = {
                        identifier,
                        type,
                        kind: "variable",
                        lineno,
                        scope,
                        isArray: false
                    }
                    tree.nodetype = tree[tree.name].children[0]["TYPE"].type;
                } else {
                    errors++;
                    showError(identifier, lineno , `'${identifier}' has already been declared as a parameter of function ${scope} (line ${lineno+1})`, true);
                }
                break;
            case 'PARAM_ARR':
                type = tree[tree.name].children[0]['TYPE'].type;
                identifier = tree[tree.name].children[1]['IDENTIFIER'].name;
                tree[tree.name].children[1].nodetype = type;
                if (symbTable.hasOwnProperty(scope) && !symbTable[scope].hasOwnProperty(identifier)) {
                    symbTable[scope][identifier] = {
                        identifier,
                        type,
                        kind: "variable",
                        lineno,
                        scope,
                        isArray: true
                    }

                    tree.nodetype = "array";
                } else {
                    errors++;
                    showError(identifier, lineno , `'${identifier}' has already been declared as a parameter of function ${scope} (line ${lineno+1})`, true);
                }
                break;
            case "ARR_VAR":
                tree[tree.name].children[1].isIndex = true;
                identifier = typeTable[scope][tree[tree.name].children[0]["IDENTIFIER"].name].type;
                // console.log((tree[tree.name].children[1].name));
                if (typeTable.hasOwnProperty(scope)  && identifier) {
                    tree.nodetype = identifier;
                }

                type = tree[tree.name].children[1].nodetype;
                if (type !== "int") {
                        errors++;
                        showError("[", lineno , `Array indexes must be integers (line ${lineno+1})`, true);
                }
                break;
            case "FUNC_DECL":
                type = tree[tree.name].children[0]['TYPE'].type;
                identifier = tree[tree.name].name;
                if (!symbTable.hasOwnProperty(identifier)) {
                    symbTable[identifier] = {};
                    symbTable["global"][identifier] = {
                            identifier,
                            type,
                            kind: "function",
                            lineno,
                            scope,
                            siblings: countSiblings(tree[tree.name].children[1])
                    }
                } else {
                    errors++;
                    showError(identifier, lineno , `Function '${identifier}' already declared at line ${symbTable[scope][identifier].lineno}`, true);
                }
                
                scope = identifier;
                break;
            case "SELECT_STMT":
                type = tree[tree.name].children[0].nodetype;
                if (type != "bool") {
                    errors++;
                    showError(identifier, lineno , `Expecting boolean test condition in if statement but got type ${type} (line ${lineno+1})`, true);
                }
                break;
           case "ITERATION_STMT":
                loopDeth.push(true);
                type = tree[tree.name].children[0].nodetype;
                if (type != "bool") {
                    errors++;
                    showError("(", lineno , `Expecting boolean test condition in while statement but got type ${type} (line ${lineno+1})`, true);
                }
                break;
            case "RETURN_STMT":
                return_found = true;
                type = tree[tree.name].children[0].nodetype;
                if (scope == "global") {
                    errors++;
                    showError("return", lineno, `Cannot return from global scope (line ${lineno+1})`, true);
                } else {
                    type2 = symbTable["global"][scope].type;
                    if (type2 === "void") {
                        errors++;
                        showError("return", lineno, `Cannot return from void function ${scope} (line ${lineno+1})`, true);
                    } else if (type !== type2) {
                        errors++;
                        showError("return", lineno, `Function ${scope} was expecting to return type ${type}, but return was of type ${type2} (line ${lineno+1})`, true);
                    }
                                        
                }
                break;
            case "IDENTIFIER":
                if (symbTable.hasOwnProperty(scope)  && symbTable[scope].hasOwnProperty(tree["IDENTIFIER"].name)) {
                    temp = symbTable[scope][tree["IDENTIFIER"].name];
                    // console.log(tree["IDENTIFIER"].name);
                    if (temp.type) tree.nodetype = temp.isArray ? "array" : temp.type;
                    if (temp.isArray) tree.isArray = true;
                    if (temp.isIndex) tree.isIndex = true;
                    if (temp.isStatic) tree.isStatic = true;
                } else if (scope != "global" && symbTable["global"].hasOwnProperty(tree["IDENTIFIER"].name)) {
                    tree.nodetype = symbTable["global"][tree["IDENTIFIER"].name].type;
                } else {
                    errors++;
                        showError(tree["IDENTIFIER"].name, lineno, `Symbol ${tree["IDENTIFIER"].name} is not defined (line ${lineno+1})`, true);
                }
                break;
            case "CONSTANT":
                tree.nodetype = "int";
                break;
            case "ASSIGN":
                type = tree[tree.name].children[0].nodetype
                type2 = tree[tree.name].children[1].nodetype
                if (type != type2) {
                    errors++;
                        showError("==", lineno, `Operands must be of the same type (line ${lineno+1})`, true);
                }
                break;
            case "+":
            case "*":
            case "-":
            case "/":
                type = tree[tree.name].children[0].nodetype
                type2 = tree[tree.name].children[1].nodetype
                if (type != type2) {
                    errors++;
                    showError(tree.name, lineno, `Operands must be of the same type (line ${lineno+1}), but operands are of types ${type} and ${type2}`, true);
                }
                break;
            case "CALL":
                identifier = tree[tree.name].children[0]["IDENTIFIER"].name;
                if (!symbTable.hasOwnProperty(identifier)) {
                    errors++;
                        showError(tree.name, lineno, `Function with nam ${identifier} is not defined (line ${lineno})`, true);
                } else {
                    if (symbTable["global"][identifier].kind != "function") {
                        errors++;
                        showError(tree.name, lineno, `Invalid function call, ${identifier} is not a function (line ${lineno})`, true);
                    } else {countSiblings(tree[tree.name].children[0])
                        const parameters = symbTable["global"][identifier].siblings;
                        // console.log(parameters);
                        const bparameters = countSiblings(tree[tree.name].children[1]) 
                        if (parameters.length > bparameters.length) {
                            errors++;
                        showError(tree.name, lineno, `Too few arguments to function call, expected ${no_parameters}, have ${bind_parameters} (line ${lineno})`, true);
                        } else if (parameters.length < bparameters.length) {
                            errors++;
                        showError(tree.name, lineno, `Too much arguments to function call, expected ${no_parameters}, have ${bind_parameters} (line ${lineno})`, true);
                        } else {
                            for (let i = 0; i < parameters.length; i++) {
                                if (parameters[i] != bparameters[i]) {
                                    errors++;
                        showError(identifier, lineno, `Expecting ${parameters[i]} in parameter ${i + 1} of call to ${identifier}, but got ${bparameters[i]} (line ${lineno})`, true);
                                };
                            }
                        }

                        
                        
                    }
                }
                // tmp = symbTable["global"][tree[tree.name]]
                break;
            case "==":
            case "!=":
                type = tree[tree.name].children[0].nodetype;
                type2 = tree[tree.name].children[1].nodetype;
                if (type != type2) {
                    errors++;
                    showError(tree.name, lineno, `Operands must be of the same type (line ${lineno})`, true);
                }
                break;
            case ">":
            case ">=":
            case "<":
            case "<=":
                type = tree[tree.name].children[0].nodetype;
                type2 = tree[tree.name].children[1].nodetype;
                if (type != type2) {
                    errors++;
                    showError(tree.name, lineno, `Operands must be of the same type (line ${lineno})`, true);
                } else if (type === "array" || type2 === "array") {
                    errors++;
                    showError(tree.name, lineno, `Operands cannot be arrays (line ${lineno})`, true);
                }
                break;           
                
        }

        if (tree[tree.name].children.length > 0) {
            for (let i = 0; i < tree[tree.name].children.length; i++) {
                treeParse(tree, tree[tree.name].children[i], scope);
            }
        }

        if ((tree.name === "COMPOUND_STMT" && !tree.isFuncCompound) || tree.name === "FUNC_DECL") { // new scope
            scope = "global";
        } else if (tree.name === "ITERATION_STMT") { // have to include relop I think
            loopDeth.pop()
        } 

        if (tree.name === "FUNC_DECL" && lineno > -1) {
            if(symbTable["global"][tree[tree.name].name].type != "void" && !return_found) {
                errors++;
                showError("", lineno, `Expecting to return type ${symbTable["global"][tree[tree.name].name].type}, but function ${tree[tree.name].name} has no return statement (line ${lineno})`, true);
            }
        }
        tree_type_str = tree.nodetype;
        tree = tree.sibling;
    }
}

var return_found = false;
var showError;


module.exports = function(tree, _showError) {
    showError = _showError;
    typeChecking(undefined, tree);
    treeParse(undefined, tree);
    if (errors > 0) {
        console.log(`Compilation finished with ${errors} errors.`)
    }
}