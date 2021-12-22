const symbols = {}

function typeChecking(par, node, scope = "global") {
    let tree = node;
    let parent = par ? par : tree;

    while (tree) {
        let temp;
        let lineno = tree.lineno;
        let type, identifier;
        switch (tree.name) {
            case 'VAR_DECL':
                type = tree[tree.name].children[0]['TYPE'].type;
                identifier = tree[tree.name].children[1]['IDENTIFIER'].name;
                tree[tree.name].children[1].nodetype = type;
                if (!symbols.hasOwnProperty(identifier)) symbols[identifier] = {
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

                if (!symbols.hasOwnProperty(identifier)) symbols[identifier] = {
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
                if (!symbols.hasOwnProperty(identifier)) symbols[identifier] = {
                    identifier,
                    type,
                    kind: "variable",
                    lineno,
                    scope,
                    isArray: false
                }
                break;
            case 'PARAM_ARR':
                type = tree[tree.name].children[0]['TYPE'].type;
                identifier = tree[tree.name].children[1]['IDENTIFIER'].name;
                tree[tree.name].children[1].nodetype = type;
                // console.log(tree[tree.name].children[1])
                if (!symbols.hasOwnProperty(identifier)) symbols[identifier] = {
                    identifier,
                    type,
                    kind: "variable",
                    lineno,
                    scope,
                    isArray: true
                }
                break;
            case 'ARR_VAR':
                tree[tree.name].children[1].isIndex = true;
                if (symbols.hasOwnProperty(tree[tree.name].children[1].name)) {
                    tree.nodetype = tree[tree.name].children[1].type;
                }
                break;
            case 'FUNC_DECL':
                type = tree[tree.name].children[0]['TYPE'].type;
                identifier = tree[tree.name].name;
                scope = identifier;
                if (!symbols.hasOwnProperty(identifier)) symbols[identifier] = {
                    identifier,
                    type,
                    kind: "function",
                    lineno,
                    scope,
                }
                break;
            case 'IDENTIFIER':
                if (symbols.hasOwnProperty(tree["IDENTIFIER"].name)) {
                    temp = symbols[tree["IDENTIFIER"].name];
                    if (temp.type) tree.nodetype = temp.type;
                    if (temp.isArray) tree.isArray = true;
                    if (temp.isIndex) tree.isIndex = true;
                    if (temp.isStatic) tree.isStatic = true;
                } else {
                    tree.nodetype = undefined;
                }
                break;
            case 'COMPOUND_STMT':
                if (parent.name != "FUNC_DECL") {
                    tree.isFuncCompound = true;
                }
                break;
            case 'CALL':
                if (symbols.hasOwnProperty(tree[tree.name].children[0]["IDENTIFIER"].name) && symbols[tree[tree.name].children[0]["IDENTIFIER"].name].type === "function") {
                    tree.nodetype = symbols[tree[tree.name].children[0]["IDENTIFIER"].name].nodetype;
                } else {
                    tree.nodetype = undefined;
                }
                break;
        }


        if (tree[tree.name].children.length > 0) {
            for (const child of tree[tree.name].children) {
                type_chk(tree, child, scope)
            }
        }

        if ((tree.name === "COMPOUND_STMT" && parent.name != "FUNC_DECL") || tree.name === "FUNC_DECL") { // new scope
            scope = "global";
        } else if (/\*|\+|\-|\/|<=|<|>|>=|==|!=/.test(tree.name)) { // have to include relop I think
            switch (tree.name) {
                case "*":
                case "*":
                case "-":
                case "/":
                    tree.nodetype = "int";
                    break;
                default:
                    tree.nodetype = "bool";
                    break;
            }
        } else if (tree.name == "ASSIGN") {
            tree.nodetype = "int";            
        }     
        
        tree = tree.sibling;
        sibling_count++;

    }
    
}


module.exports = function(tree) {
    typeChecking(undefined, tree);
    // console.table(symbols);
}