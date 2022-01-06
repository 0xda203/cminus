const cc = require("node-console-colors");

module.exports = function (lines) {
    function showError(elem, lineno, err, print = false, errname = "SemanticError",) {
        let index = lines[lineno].indexOf(elem);
        const start = ((index - 18) > 0) ? index - 18 : 0;
        const end = ((index + 18) > lines[lineno].length) ? index + 18 : lines[lineno].length;
        let substr = (start === 0 ? "" : "...") + lines[lineno].substring(start, end) + "\n" +
            "-".repeat(start === 0 ? index < 0 ? 1 : index : 21) + "^" + "\n";
        if (print) return console.error(cc.set("fg_dark_red", errname + ": ") + cc.set("fg_white", err + "\n" + substr));
        else return (errname === "" ? "" : ": ") + err + "\n" + substr;
    }
    return showError;
}