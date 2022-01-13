const treeify = require('treeify');

function TreeNode(lineno, name, children = [], attr = {}) {
    const obj = {
        name,
        lineno,
        children: children.filter(c => !!c),
        ...attr,
    }

    obj.toString = function () {
        return treeify.asTree(obj, true, true);
    }

    return obj;
}

module.exports = TreeNode;
