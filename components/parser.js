const { Parser } = require(`jison`);
const TreeNode = require('./treenode');
const { TOKENS, SYMBOLS } = require('./lexer')

class ParserError extends Error {
	constructor(message = "", ...args) {
	  super(message, ...args);
	  this.name = "ParserError";
	}
}

global.ParserError = ParserError;

global.Node = TreeNode;

module.exports = function(lexer) {

  const grammar = {
    tokens: TOKENS,
    startSymbol: `program`,
    operators: [
      [`nonassoc`, `LOWER_THAN_ELSE`],
      [`nonassoc`, `ELSE`],
      [`left`, `PLUS`],
      [`left`, `MINUS`],
      [`left`, `TIMES`],
      [`left`, `OVER`],
      [`left`, `COMMA`],
      [`right`, `ASSIGN`],
    ],
    bnf: {
      program: [[`declaration_list`, `$$ = new Node(yylineno ,'Program', [$1]); return $$;`]],
      declaration_list: [
        [`declaration_list declaration`, `
        $: t = $1; 
        if (t != undefined) {
          while (t.sibling != undefined) {
            t = t.sibling;
          }
          t.sibling = $2;
          $$ = $1;
        } else {
          $$ = $2;
        }`],
        [`declaration`, `$$ = $1;`],
      ],
      declaration: [
        [`var_declaration`, `$$ = $1;`],
        [`func_declaration`, `$$ = $1`],
      ],
      var_declaration: [
        [`type_specifier identifier SEMI`, `$$ = new Node(yylineno ,'VAR_DECL', [$1, $2]);`],
        [
          `type_specifier identifier LBRACE number RBRACE SEMI`,
          `$$ = new Node(yylineno ,'ARR_DECL', [$1, $2, $4]);`,
        ],
      ],
      type_specifier: [
        [`INT`, `$$  = new Node(yylineno ,'TYPE', [], {type: 'int'});`],
        [`VOID`, `$$ = new Node(yylineno ,'TYPE', [], {type: 'void'});`],
      ],
      identifier: [[`ID`, `$$ = new Node(yylineno ,'IDENTIFIER', [], {name: yytext});`]],
      number: [[`NUM`, `$$ = new Node(yylineno ,'CONSTANT', [], {value: parseInt(yytext)});`]],
      func_declaration: [
        [
          `type_specifier identifier LPAREN params RPAREN compound_stmt`,
          `$$ = new Node(yylineno ,'FUNC_DECL', [$1, $4, $6], {name: $2[$2.name].name});`,
        ],
      ],
      params: [
        [`param_list`, `$$ = $1;`],
        [`VOID`, `$$ = null;`],
      ],
      param_list: [
        [`param_list COMMA param`, `
        $: t = $1; 
        if (t != undefined) {
          while (t.sibling != undefined) {
            t = t.sibling;
          }
          t.sibling = $3;
          $$ = $1;
        } else {
          $$ = $3;
        }`],
        [`param`, `$$ = $1;`],
      ],
      param: [
        [`type_specifier identifier`, `$$ = new Node(yylineno ,'PARAM_VAR', [$1, $2]);`],
        [
          `type_specifier identifier LBRACE RBRACE`,
          `$$ = new Node(yylineno ,'PARAM_ARR', [$1, $2]);`,
        ],
      ],
      compound_stmt: [[
        `LCURLY local_declarations statement_list RCURLY`,
        `$$ = new Node(yylineno ,'COMPOUND_STMT', [$2, $3]);`
      ]],
      local_declarations: [
        [`local_declarations var_declaration`, `
        $: t = $1; 
        if (t != undefined) {
          while (t.sibling != undefined) {
            t = t.sibling;
          }
          t.sibling = $2;
          $$ = $1;
        } else {
          $$ = $2;
        }`],
        [``, `$$ = null;`],
      ],
      statement_list: [
        [`statement_list statement`, `
        $: t = $1; 
        if (t != undefined) {
          while (t.sibling != undefined) {
            t = t.sibling;
          }
          t.sibling = $2;
          $$ = $1;
        } else {
          $$ = $2;
        }`],
        [``, `$$ = null;`],
      ],
      statement: [
        [`expression_stmt`, `$$ = $1;`],
        [`compound_stmt`, `$$ = $1;`],
        [`selection_stmt`, `$$ = $1;`],
        [`iteration_stmt`, `$$ = $1;`],
        [`return_stmt`, `$$ = $1;`],
      ],
      expression_stmt: [
        [`expression SEMI`, `$$ = $1;`],
        [`SEMI`, `$$ = null;`],
      ],
      selection_stmt: [
        [`IF LPAREN expression RPAREN statement %prec LOWER_THAN_ELSE`, `$$ = new Node(yylineno ,'SELECT_STMT', [$3, $5]);`],
        [`IF LPAREN expression RPAREN statement ELSE statement`, `$$ = new Node(yylineno ,'SELECT_STMT', [$3, $5, $7]);`]
      ],
      iteration_stmt: [ [
        `WHILE LPAREN expression RPAREN statement`, `$$ = new Node(yylineno ,'ITERATION_STMT',[$3, $5]);`
      ]],
      return_stmt: [
        [`RETURN SEMI`, `$$ = new Node(yylineno ,'RETURN_STMT', [undefined]);`],
        [`RETURN expression SEMI`, `$$ = new Node(yylineno ,'RETURN_STMT', [$2]);`],
      ],  
      expression: [
        [`var ASSIGN expression`, `$$ = new Node(yylineno ,'ASSIGN', [$1, $3]);`],
        [`simple_expression`, `$$ = $1;`],
      ],
      var: [
        [`identifier`, `$$ = $1;`],
        [`identifier LBRACE expression RBRACE`, `$$ = new Node(yylineno ,'ARR_VAR', [$1, $3]);`],
      ],
      simple_expression: [
        [`additive_expression relop additive_expression`, `$$ = $2; $$.children = [$1, $3];`],
        [`additive_expression`, `$$ = $1;`],
      ],
      relop: [
        [`LE`, `$$ = new Node(yylineno ,'<=', [], {op: 'LE'});`],
        [`LT`, `$$ = new Node(yylineno ,'<', [], {op: 'LT'});`],
        [`GT`, `$$ = new Node(yylineno ,'>', [], {op: 'GT'});`],
        [`GE`, `$$ = new Node(yylineno ,'>=', [], {op: 'GE'});`],
        [`EQ`, `$$ = new Node(yylineno ,'==', [], {op: 'EQ'});`],
        [`NE`, `$$ = new Node(yylineno ,'!=', [], {op: 'NE'});`],
      ],
      additive_expression: [
        [`additive_expression addop term`, `$$ = $2; $$.children = [$1, $3];`],
        [`term`, `$$ = $1;`],
      ],
      addop: [
        [`PLUS`, `$$ = new Node(yylineno ,'+', [], {op: 'PLUS'});`],
        [`MINUS`, `$$ = new Node(yylineno ,'-', [], {op: 'MINUS'});`],
      ],
      term: [
        [`term mulop factor `, `$$ = $2; $$.children = [$1, $3];;`],
        [`factor`, `$$ = $1;`],
      ],
      mulop: [
        [`TIMES`, `$$ = new Node(yylineno ,'*', [], {op: 'TIMES'});`],
        [`OVER`, `$$ = new Node(yylineno ,'/', [], {op: 'OVER'});`],
      ],
      factor: [
        [`LPAREN expression RPAREN`, `$$ = $2;`],
        [`var`, `$$ = $1;`],
        [`call`, `$$ = $1;`],
        [`number`, `$$ = $1;`]
      ],
      call: [[
        `identifier LPAREN args RPAREN`, `$$ = new Node(yylineno ,'CALL', [$1, $3]);`
      ]],
      args: [
        [`arg_list`, `$$ = $1;`],
        [``, `$$ = null;`],
      ],
      arg_list: [
        [`arg_list COMMA expression`, `
        $: t = $1; 
        if (t != undefined) {
          while (t.sibling) {
            t = t.sibling;
          }
          t.sibling = $3;
          $$ = $1;
        } else {
          $$ = $3;
        }`],
        [`expression`, `$$ = $1;`]
      ],
    },
  };
  
  const parser = new Parser(grammar, {type: "lalr", debug:false, enableDebugLogs: false, reportStats: false});
  
  parser.lexer = lexer;

  var realLex = parser.lexer.lex;

  parser.lexer.lex = function () {
    parser.yy.lastLineBreak = parser.yy.lineBreak;
    parser.yy.lineBreak = false;
    parser.yy.showPosition = this.showPosition();
    return realLex.call(this);
  };
  
  parser.yy.parseError = function (err, hash) {
    if (!((!hash.expected || hash.expected.indexOf("';'") >= 0) && (hash.token === 'RBRACE' || hash.token === 'ERROR' || parser.yy.lineBreak || parser.yy.lastLineBreak || hash.token === 1 ))) {
      const lst = hash.expected.map(item => "'" + SYMBOLS[item.replace(/'/g, '')] + "'").join(", ")
      const message = `Unrecognized expression '${hash.text}' at line ${hash.line}, expected ${lst}\n${hash.position}`
        throw new ParserError(message);
    }
  };

  return parser;
}