function SymbolTable() {
    this.table = {
        "global": {}
    }

    this.insert = function (identifier, data, scope = "global", isFunction = false) {
        if (isFunction) {
            this.table[identifier] = {}
            this.table[scope][identifier] = { identifier, ...data, scope };
            return this.table[scope][identifier];
        } else {
            this.table[scope][identifier] = { identifier, isArray: false, ...data, scope };
            return this.table[scope][identifier];
        }
    }

    this.lookup = function (identifier, scope) {
        if (!this.table.hasOwnProperty(scope)) return;
        if (this.table[scope].hasOwnProperty(identifier)) return this.find(identifier, scope);
        return this.find(identifier, "global");
    }

    this.find = function (identifier, scope) {
        return this.table[scope][identifier];
    }

}

module.exports = SymbolTable;

