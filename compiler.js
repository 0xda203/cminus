const Lexer = require('./components/lexer')
const Parser = require('./components/parser');
const Analyzer = require('./components/analyzer')
const Generator = require('./components/generator');

function Compiler(options) {
    options = options || {};

    this.lexer = Lexer;
    this.parser = new Parser(this.lexer);
    this.analyzer = new Analyzer();
    this.generator = new Generator();

    this.compile = function (source) {
        const lines = source.toString().split("\n");
        const showError = require("./util/errors")(lines);
        this.parser.showError = showError;
        this.analyzer.showError = showError;

        const abstractSyntaxTree = this.parser.parse(source);

        if (options.verbose)
            console.log(abstractSyntaxTree.toString())

        const [parseTree, errors] = this.analyzer.performAnalysis(abstractSyntaxTree);

        let generatedCode;

        if (errors === 0) {
            generatedCode = this.generator.generate(parseTree);
        }

        return [errors, generatedCode];
    }
}

module.exports = Compiler;