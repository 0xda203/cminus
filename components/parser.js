const { Parser, G } = require('jison')
const fs = require('fs')
const { RegExpLexer } = require('jison/tests/setup')

var grammar = fs.readFileSync('../util/grammar.jison', 'utf8')

const lexData = {
	rules: [
		['if', "return 'IF';"],
		['then', "return 'THEN';"],
		['else', "return 'ELSE';"],
		['end', "return 'END';"],
		['repeat', "return 'REPEAT';"],
		['until', "return 'UNTIL';"],
		['read', "return 'READ';"],
		['write', "return 'WRITE';"],
		['int', "return 'INT';"],
		['while', "return 'WHILE';"],
		['void', "return 'VOID';"],
		['\\[', "return 'LBRACE';"],
		['\\]', "return 'RBRACE';"],
		['return', "return 'RETURN';"],
		['=', "return 'ASSIGN';"],
		['==', "return 'EQ';"],
		['<', "return 'LT';"],
		['>', "return 'GT';"],
		['<=', "return 'LE';"],
		['>=', "return 'GE';"],
		['!=', "return 'NE';"],
		['\\+', "return 'PLUS';"],
		['-', "return 'MINUS';"],
		['\\*', "return 'TIMES';"],
		['/', "return 'OVER';"],
		['\\(', "return 'LPAREN';"],
		['\\)', "return 'RPAREN';"],
		[';', "return 'SEMI';"],
		['[0-9]+', "return 'NUMBER';"],
		['[a-zA-Z]+', "return 'ID';"],
		['\\n', 'yylineno++;'],
		['[ \\t],+', ''],
		['{', "return 'LCURLY';"],
		['}', "return 'RCURLY';"],
		[',', "return 'COMMA';"],
		['\\.', "return 'ERROR';"]
	]
}

const parser = new Parser(grammar, { type: 'lalr' })

var r = parser.parse(`int x[10];

int minloc(int a[], int low, int high) {
    int i; int x; int k;
    k = low;
    x = a[low];
    i = low + 1;
    while (i < high) 
        { if (a[i] < x) {
            x = a[i];
            k = i;  }
        i = i + 1;
    }
    return k;
}

void sort(int a[], int low, int high) {
    int i; int k;
    i = low;
    while (i < high-1) {
        int t;
        k = minloc(a, i, high);
        t = a[k];
        a[k] = a[i];
        a[i] = t;
        i = i + 1;
    }
}

void main(void) {
    int i;
    i = 0;
    while (i < 10) {
        x[i] = input();
        i = i + 1;
    }
    sort(x, 0, 10);
    i = 0;
    while (i < 10) {
        output(x[i]);
        i = i + 1;
    }
}`)

console.log(r)
