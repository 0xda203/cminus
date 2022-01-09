const RegExpLexer = require("jison-lex");

const lexData = {
	macros: {
		digit: "[0-9]",
		letter: "[a-zA-Z]",
	},
	rules: [
		/* ignore comment */
		["\\/\\*", function () {
			let finished = true;
			let startline = yylineno + 1;

			while (yytext.substr(-2) != '*/') {
				if (this.more()._input == '') {
					finished = false;
					break;
				} else {
					yylineno++;
				}
				this.input();
			}

			if (!finished) {
				throw new SyntaxError(`Unfinished comment at line ${startline}\n${this.showPosition()}`);
			}
		}],
		["\\/\\/", function () {
			throw new SyntaxError(`Unexpected token '//' in expression or statement at line ${yylineno + 1}\n${this.showPosition()}`);
		}],
		["\\s+", "/* skip whitespace */"],
		["if", "return 'IF';"],
		["else", "return 'ELSE';"],
		["int", "return 'INT';"],
		["void", "return 'VOID';"],
		["return", "return 'RETURN';"],
		["while", "return 'WHILE';"],
		["\\[", "return 'LBRACE';"],
		["\\]", "return 'RBRACE';"],
		["<=", "return 'LE';"],
		[">=", "return 'GE';"],
		["<", "return 'LT';"],
		[">", "return 'GT';"],
		["==", "return 'EQ';"],
		["!=", "return 'NE';"],
		["=", "return 'ASSIGN';"],
		["\\+", "return 'PLUS'"],
		["-", "return 'MINUS';"],
		["\\*", "return 'TIMES';"],
		["/", "return 'OVER';"],
		["\\(", "return 'LPAREN';"],
		["\\)", "return 'RPAREN';"],
		[";", "return 'SEMI';"],
		["{digit}+", "return 'NUM';"],
		["{letter}+", "return 'ID';"],
		["\n", "yylineno++;"],
		["\\{", "return 'LCURLY';"],
		["\\}", "return 'RCURLY';"],
		[",", "return 'COMMA';"],
		[".", function () {
			throw new SyntaxError(`Unexpected token '${yytext}' in expression or statement on line ${yylineno + 1}\n${this.showPosition()}`);
		}],
	],
}

const Lexer = new RegExpLexer(lexData);
const realLex = Lexer.lex;

global.lexer = Lexer;
module.exports = Lexer;