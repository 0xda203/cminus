const RegExpLexer = require("jison-lex");

const TOKENS = [
	"ELSE",
	"IF",
	"INT",
	"RETURN",
	"VOID",
	"WHILE",
	"PLUS",
	"MINUS",
	"TIMES",
	"OVER",
	"ID",
	"NUM",
	"LT",
	"LE",
	"GT",
	"GE",
	"EQ",
	"NE",
	"SEMI",
	"LPAREN",
	"RPAREN",
	"LBRACE",
	"RBRACE",
	"LBRACKET",
	"RBRACKET",
	"COMMA",
	"SEMI",
	"ASSIGN",
	"ERROR",
];

const SYMBOLS = {
	"ELSE": "else",
	"IF": "if",
	"INT": "int",
	"RETURN": "return",
	"VOID": "void",
	"WHILE": "while",
	"PLUS": "plus",
	"MINUS": "-",
	"TIMES": "*",
	"OVER": "/",
	"ID": "identifier",
	"NUM": "number",
	"LT": "<",
	"LE": "<=",
	"GT": ">",
	"GE": ">=",
	"EQ": "==",
	"NE": "!=",
	"ASSIGN": "=",
	"COMMA": ",",
	"SEMI": ";",
	"LPAREN": "(",
	"RPAREN": ")",
	"LBRACE": "[",
	"RBRACE": "]",
	"LBRACKET": "{",
	"RBRACKET": "}",
};

const lexData = {
	macros: {
		digit: "[0-9]",
		letter: "[a-zA-Z]",
	},
	rules: [
		["\\/\\*", function () {
			let finished = true;
			let startline = yylineno + 1;

			while (yytext.substr(-2) != '*/') {
				if (this.more()._input == '') {
					finished = false;
					break;
				}
				this.input();
			}

			if (!finished) {
				throw new SyntaxError(`Unfinished comment at line ${startline}\n${this.showPosition()}`);
			}
			/* ignore comment */
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
		["<", "return 'LT';"],
		["<=", "return 'LE';"],
		[">", "return 'GT';"],
		[">=", "return 'GE';"],
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

module.exports = { Lexer: new RegExpLexer(lexData), TOKENS, SYMBOLS };