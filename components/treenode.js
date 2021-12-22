const treeify = require('treeify');

function TreeNode(lineno, name, children = [], attr = {}) {
    const obj = {
        [name]: {
        }
    }

    Object.defineProperty(obj, 'name', {
        enumerable : false,
        value : name
    })

    Object.defineProperty(obj, 'lineno', {
        enumerable : false,
        value : lineno
    })

    if (children.length > 0) {
        children = children.filter(child => child != null);
        // obj[name] = {...obj[name], ..._children}
        Object.defineProperty(obj[name], 'children', {
            enumerable : true,
            value : children
        });
        
    }
    if (Object.keys(attr).length > 0) {
        obj[name] = {...obj[name], ...attr};
        Object.defineProperty(obj[name], 'attr', {
            enumerable : false,
            value : attr
        });
    }

    obj.toString = function () {
        return treeify.asTree(obj, true, true);
    }
    
    return obj;
}   

module.exports = TreeNode;
