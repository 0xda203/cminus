const io = require('../util/io')
const SymbolTable = require('./symboltable')

const typeTable = new SymbolTable();

function findSiblings(node) {
    let p = node;
    let arr = [];
    while (p && p.name != "COMPOUND_STMT") {
        arr.push(p.type || p.value || p.children[0].type);
        p = p.sibling;
    }
    return arr;
}


function decorate(_node, parent, scope = "global") {
    let node = _node;
    while (node) {
        let type, identifier, temp;
        switch (node.name) {
            case "VAR_DECL":
                type = node.children[0].type;
                identifier = node.children[1].identifier;
                node.symbol = typeTable.insert(identifier, { type, kind: 'variable', size: 1 }, scope)
                break;
            case "ARR_DECL":
                type = node.children[0].type;
                identifier = node.children[1].identifier;
                size = node.children[2].value;
                node.symbol = typeTable.insert(identifier, { type, kind: "variable", isArray: true, size }, scope)
                break;
            case "FUNC_DECL":
                identifier = node.identifier;
                type = node.children[0].type;
                let parameters = findSiblings(node.children[1]);
                node.symbol = typeTable.insert(identifier, { type, kind: "function", noParameters: parameters.length, parameters }, scope, true)
                scope = identifier;
                node.compound_stmt = node.children[node.children.length - 1];
                break;
            case "PARAM_VAR":
                type = node.children[0].type;
                identifier = node.children[1].identifier;
                node.symbol = typeTable.insert(identifier, { type, kind: "variable", isParam: true }, scope)
                node.type = "int";
                break;
            case "PARAM_ARR":
                type = node.children[0].type;
                identifier = node.children[1].identifier;
                node.symbol = typeTable.insert(identifier, { type, kind: "variable", isParam: true, isArray: true }, scope)
                node.type = "array";
                break;
            case "ARR_VAR":
                identifier = node.children[0].identifier;
                temp = typeTable.lookup(identifier, scope);
                node.type = "int";
                if (temp) {
                    node.symbol = temp;
                    node.arr_identifier = node.children[0];
                    node.arr_expr = node.children[1];
                }
                break;
            case "CONSTANT":
                node.type = "int";
                node.value = node.value;
                break;
            case "IDENTIFIER":
                temp = typeTable.lookup(node.identifier, scope);
                if (temp) {
                    node.symbol = temp;
                    node.isParam = node.symbol.isParam;
                    node.isArray = node.symbol.isArray;
                    if (node.isArray) node.type = "array"
                    else node.type = "int";
                }
                break;
            case "COMPOUND_STMT":
                node.isFuncCompound = (parent.name == "FUNC_DECL");
                node.local_decl = node.children[0];
                node.stmt_list = node.children[1];
                break;
            case "CALL":
                identifier = node.children[0].identifier;
                temp = typeTable.lookup(identifier, scope);
                if (temp && temp.kind === "function") {
                    node.symbol = temp;
                    node.args_list = node.children[1];
                    node.type = temp.type;
                }
                break;
            case "SELECT_STMT":
                node.expr = node.children[0];
                node.if_stmt = node.children[1];
                node.else_stmt = node.children[2];
                break;
            case "ITERATION_STMT":
                node.while_expr = node.children[0];
                node.compound_stmt = node.children[1];
                break;
            case "RETURN_STMT":
                node.ret_expr = node.children[0];
                break;
            case "ASSIGN":
                node.assign_var = node.children[0];
                node.assign_expr = node.children[1];
                break;
            case "*":
            case "/":
            case "+":
            case "-":
                node.type = "int";
                node.left = node.children[0];
                node.right = node.children[1];
                break;
            case "<=":
            case "<":
            case ">=":
            case ">":
            case "==":
            case "!=":
                node.left = node.children[0];
                node.right = node.children[1];
                node.type = "bool";
                break;
        }

        for (let i = 0; i < node.children.length; i++)
            decorate(node.children[i], node, scope);

        if (node.name === "FUNC_DECL") scope = "global";


        node = node.sibling;
    }
}

function Analyzer() {
    this.errors = 0;
    this.returnFound = false;
    this.symbolTable = new SymbolTable();

    this.semanticAnalysis = function (node, scope = "global") {
        while (node) {
            let type, identifier, temp, temp2, lineno = node.lineno;
            switch (node.name) {
                case "VAR_DECL":
                    type = node.children[0].type;
                    identifier = node.children[1].identifier;
                    temp = this.symbolTable.find(identifier, scope)

                    if (temp) {
                        this.errors++;
                        this.showError(
                            identifier,
                            lineno,
                            `Variable ${identifier} has already been declared in the present scope at line ${temp.lineno} (line ${lineno + 1})`,
                            true
                        );
                    } else {
                        node.symbol2 = this.symbolTable.insert(identifier, { type, kind: 'variable', size: 1 }, scope)
                    }
                    break;
                case "ARR_DECL":
                    type = node.children[0].type;
                    identifier = node.children[1].identifier;
                    size = node.children[2].value;

                    temp = this.symbolTable.find(identifier, scope)

                    if (temp) {
                        this.errors++;
                        this.showError(
                            identifier,
                            lineno,
                            `Variable ${identifier} (array) has already been declared in the present scope at line ${temp.lineno
                            } (line ${lineno + 1})`,
                            true
                        );
                    } else {
                        node.symbol2 = this.symbolTable.insert(identifier, { type, kind: "variable", isArray: true, size }, scope)
                    }
                    break;
                case "FUNC_DECL":
                    identifier = node.identifier;
                    type = node.children[0].type;
                    let parameters = findSiblings(node.children[1]);

                    temp = this.symbolTable.lookup(identifier, "global")

                    if (temp) {
                        this.errors++;
                        this.showError(
                            identifier,
                            lineno,
                            `Function '${identifier}' already declared at line ${temp.lineno}`,
                            true
                        );
                    } else {
                        node.symbol2 = this.symbolTable.insert(identifier, { type, kind: "function", noParameters: parameters.length, parameters }, "global", true);
                    }

                    scope = identifier;
                    break;
                case "PARAM_VAR":
                    type = node.children[0].type;
                    identifier = node.children[1].identifier;

                    temp = this.symbolTable.find(identifier, scope)

                    if (temp) {
                        this.errors++;
                        this.showError(
                            identifier,
                            lineno,
                            `'${identifier}' has already been declared as a parameter of function ${scope} (line ${lineno + 1
                            })`,
                            true
                        );
                    } else {
                        node.symbol2 = this.symbolTable.insert(identifier, { type, kind: "variable", isParam: true }, scope)
                    }

                    break;
                case "PARAM_ARR":
                    type = node.children[0].type;
                    identifier = node.children[1].identifier;

                    temp = this.symbolTable.find(identifier, scope)

                    if (temp) {
                        this.errors++;
                        this.showError(
                            identifier,
                            lineno,
                            `'${identifier}' has already been declared as a parameter of function ${scope} (line ${lineno + 1
                            })`,
                            true
                        );
                    } else {
                        node.symbol2 = this.symbolTable.insert(identifier, { type, kind: "variable", isParam: true, isArray: true }, scope)
                    }

                    break;
                case "ARR_VAR":
                    temp = node.children[1];
                    if (temp.type !== "int") {
                        this.errors++;
                        this.showError(
                            "[",
                            lineno,
                            `Array indexes must be integers (line ${lineno + 1})`,
                            true
                        );
                    }
                    break;
                case "IDENTIFIER":
                    temp = this.symbolTable.lookup(node.identifier, scope);
                    if (!temp) {
                        this.errors++;
                        this.showError(
                            node.identifier,
                            lineno,
                            `${node.identifier} is not defined (line ${lineno + 1
                            })`,
                            true
                        );
                    }
                    break;
                case "CALL":
                    identifier = node.children[0].identifier;
                    temp = this.symbolTable.lookup(identifier, scope);
                    if (!temp) {
                        this.errors++;
                        this.showError(
                            node.name,
                            lineno,
                            `Function with name ${identifier} is not defined (line ${lineno})`,
                            true
                        );
                    } else if (temp.kind !== "function") {
                        this.errors++;
                        this.showError(
                            node.name,
                            lineno,
                            `Invalid function call, ${identifier} is not a function (line ${lineno})`,
                            true
                        );
                    } else {
                        // console.log(temp.);
                        const parameters = temp.parameters,
                            bparameters = findSiblings(node.children[1]);

                        if (parameters.length > bparameters.length) {
                            this.errors++;
                            this.showError(
                                identifier,
                                lineno,
                                `Too few arguments to function call, expected ${parameters.length}, have ${bparameters.length} (line ${lineno})`,
                                true
                            );
                        } else if (parameters.length < bparameters.length) {
                            this.errors++;
                            this.showError(
                                identifier,
                                lineno,
                                `Too much arguments to function call, expected ${parameters.length}, have ${bparameters.length} (line ${lineno})`,
                                true
                            );
                        } else {
                            for (let i = 0; i < parameters.length; i++) {
                                if (parameters[i] != bparameters[i]) {
                                    this.errors++;
                                    this.showError(
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
                    break;
                case "SELECT_STMT":
                    type = node.children[0].type;
                    if (type != "bool") {
                        this.errors++;
                        this.showError(
                            identifier,
                            lineno,
                            `Expecting boolean test condition in if statement but got type ${type} (line ${lineno + 1
                            })`,
                            true
                        );
                    }
                case "ITERATION_STMT":
                    type = node.children[0].type;
                    if (type != "bool") {
                        this.errors++;
                        this.showError(
                            "(",
                            lineno,
                            `Expecting boolean test condition in while statement but got type ${type} (line ${lineno + 1
                            })`,
                            true
                        );
                    }
                    break;
                case "RETURN_STMT":
                    this.returnFound = true;
                    type = node.children[0].type;
                    temp = this.symbolTable.lookup(scope, "global");
                    if (temp.type === "void") {
                        this.errors++;
                        this.showError(
                            "return",
                            lineno,
                            `Cannot return from void function ${scope} (line ${lineno + 1})`,
                            true
                        );
                    } else if (type != temp.type) {
                        this.errors++;
                        this.showError(
                            "return",
                            lineno,
                            `Function ${scope} was expecting to return type ${temp.symbol2.type}, but return was of type ${type} (line ${lineno + 1
                            })`,
                            true
                        );
                    }
                    break;
                case "ASSIGN":
                    temp = node.children[0].type;
                    temp2 = node.children[1].type;
                    if (temp != temp2) {
                        this.errors++;
                        this.showError(
                            "=",
                            lineno,
                            `Operands must be of the same type (line ${lineno + 1})`,
                            true
                        );
                    }
                    break;
                case "*":
                case "/":
                case "+":
                case "-":
                case "<=":
                case "<":
                case ">=":
                case ">":
                case "==":
                case "!=":
                    temp = node.left.type;
                    temp2 = node.right.type;
                    if (temp != temp2) {
                        this.errors++;
                        this.showError(
                            node.name,
                            lineno,
                            `Operands must be of the same type (line ${lineno + 1})`,
                            true
                        );
                    } else if (temp === "array" && temp2 === "array") {
                        this.errors++;
                        this.showError(
                            node.name,
                            lineno,
                            `Operands cannot be arrays (line ${lineno})`,
                            true
                        );
                    }
                    break;
            }

            for (let i = 0; i < node.children.length; i++)
                this.semanticAnalysis(node.children[i], scope)

            if (
                (node.name === "COMPOUND_STMT" && !node.isFuncCompound) ||
                node.name === "FUNC_DECL"
            ) {
                // new scope
                scope = "global";
            }

            if (node.name === "FUNC_DECL") {
                if (!node.isNative && node.symbol2.type !== "void" && !this.returnFound) {
                    this.errors++;
                    this.showError(
                        "",
                        lineno,
                        `Expecting to return type ${node.symbol2.type}, but function ${node.name} has no return statement (line ${lineno})`,
                        true
                    );
                }
                this.returnFound = false;
            }

            node = node.sibling;
        }

        if (this.symbolTable.hasOwnProperty("main")) {
            this.errors++;
            this.showError(
                "",
                lineno,
                `Missing main function`,
                true
            )
        }
    }

    this.performAnalysis = function (abstractTree) {
        const input = io({ ...abstractTree.children[0] });
        abstractTree.children[0] = input;

        decorate(abstractTree);
        this.semanticAnalysis(abstractTree, undefined, "global");

        return [abstractTree.children[0], this.errors];
    }


}

module.exports = Analyzer;