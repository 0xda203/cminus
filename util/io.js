const TreeNode = require('../components/treenode');

module.exports = function (sibling) {
    let input = new TreeNode(-1, 'FUNC_DECL', [
        new TreeNode(-1, 'TYPE', [], { type: 'void' }),
        // new TreeNode(-1, 'COMPOUND_STMT', []),
    ], { name: "input" })

    let output = new TreeNode(-1, 'FUNC_DECL', [
        new TreeNode(-1, 'TYPE', [], { type: 'void' }),
        new TreeNode(-1, 'PARAM_VAR', [
            new TreeNode(-1, 'TYPE', [], { type: 'int' }),
            new TreeNode(-1, 'IDENTIFIER', [], { name: 'x' })
        ]),
        // new TreeNode(-1, 'COMPOUND_STMT', [])
    ], { name: "output" });

    input.isNative = true;
    output.isNative = true;
    input.operation = "input";
    output.operation = "output";

    output.sibling = sibling;
    input.sibling = output;

    return input;
}