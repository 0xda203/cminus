const tokens = require('./tokens')
global.TreeNode = require('./treenode')

const grammar = {
    tokens,
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
        program: [[`declaration_list`, `$$ = new TreeNode(yylineno,'Program', [$1]); return $$;`]],
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
            [`func_declaration`, `$$ = $1;`],
        ],
        var_declaration: [
            [`type_specifier identifier SEMI`, `$$ = new TreeNode(yylineno,'VAR_DECL', [$1, $2]);`],
            [
                `type_specifier identifier LBRACE number RBRACE SEMI`,
                `$$ = new TreeNode(yylineno,'ARR_DECL', [$1, $2, $4]);`,
            ],
        ],
        type_specifier: [
            [`INT`, `$$  = new TreeNode(yylineno,'TYPE', [], {type: 'int'});`],
            [`VOID`, `$$ = new TreeNode(yylineno,'TYPE', [], {type: 'void'});`],
        ],
        identifier: [[`ID`, `$$ = new TreeNode(yylineno,'IDENTIFIER', [], {name: yytext});`]],
        number: [[`NUM`, `$$ = new TreeNode(yylineno,'CONSTANT', [], {value: parseInt(yytext)});`]],
        func_declaration: [
            [
                `type_specifier identifier LPAREN params RPAREN compound_stmt`,
                `$$ = new TreeNode($2.lineno,'FUNC_DECL', [$1, $4, $6], {name: $2[$2.name].name}); `,
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
            [`type_specifier identifier`, `$$ = new TreeNode(yylineno,'PARAM_VAR', [$1, $2]);`],
            [
                `type_specifier identifier LBRACE RBRACE`,
                `$$ = new TreeNode(yylineno,'PARAM_ARR', [$1, $2]);`,
            ],
        ],
        compound_stmt: [[
            `LCURLY local_declarations statement_list RCURLY`,
            `$$ = new TreeNode(yylineno,'COMPOUND_STMT', [$2, $3]);`
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
            [`IF LPAREN expression RPAREN statement`, `$$ = new TreeNode(yylineno,'SELECT_STMT', [$3, $5]);`],
            [`IF LPAREN expression RPAREN statement ELSE statement`, `$$ = new TreeNode(yylineno,'SELECT_STMT', [$3, $5, $7]);`]
        ],
        iteration_stmt: [[
            `WHILE LPAREN expression RPAREN statement`, `$$ = new TreeNode($3.lineno,'ITERATION_STMT',[$3, $5]);`
        ]],
        return_stmt: [
            [`RETURN SEMI`, `$$ = new TreeNode(yylineno,'RETURN_STMT', [undefined]);`],
            [`RETURN expression SEMI`, `$$ = new TreeNode(yylineno,'RETURN_STMT', [$2]);`],
        ],
        expression: [
            [`var ASSIGN expression`, `$$ = new TreeNode(yylineno,'ASSIGN', [$1, $3]);`],
            [`simple_expression`, `$$ = $1;`],
        ],
        var: [
            [`identifier`, `$$ = $1;`],
            [`identifier LBRACE expression RBRACE`, `$$ = new TreeNode(yylineno,'ARR_VAR', [$1, $3]);`],
        ],
        simple_expression: [
            [`additive_expression relop additive_expression`, `$$ = $2; $$[$$.name].children = [$1, $3];`],
            [`additive_expression`, `$$ = $1;`],
        ],
        relop: [
            [`LE`, `$$ = new TreeNode(yylineno,'<=', [], {op: 'LE'});`],
            [`LT`, `$$ = new TreeNode(yylineno,'<', [], {op: 'LT'});`],
            [`GT`, `$$ = new TreeNode(yylineno,'>', [], {op: 'GT'});`],
            [`GE`, `$$ = new TreeNode(yylineno,'>=', [], {op: 'GE'});`],
            [`EQ`, `$$ = new TreeNode(yylineno,'==', [], {op: 'EQ'});`],
            [`NE`, `$$ = new TreeNode(yylineno,'!=', [], {op: 'NE'});`],
        ],
        additive_expression: [
            [`additive_expression addop term`, `$$ = $2; $$[$$.name].children = [$1, $3];`],
            [`term`, `$$ = $1;`],
        ],
        addop: [
            [`PLUS`, `$$ = new TreeNode(yylineno,'+', [], {op: 'PLUS'});`],
            [`MINUS`, `$$ = new TreeNode(yylineno,'-', [], {op: 'MINUS'});`],
        ],
        term: [
            [`term mulop factor `, `$$ = $2; $$[$$.name].children = [$1, $3];;`],
            [`factor`, `$$ = $1;`],
        ],
        mulop: [
            [`TIMES`, `$$ = new TreeNode(yylineno,'*', [], {op: 'TIMES'});`],
            [`OVER`, `$$ = new TreeNode(yylineno,'/', [], {op: 'OVER'});`],
        ],
        factor: [
            [`LPAREN expression RPAREN`, `$$ = $2;`],
            [`var`, `$$ = $1;`],
            [`call`, `$$ = $1;`],
            [`number`, `$$ = $1;`]
        ],
        call: [[
            `identifier LPAREN args RPAREN`, `$$ = new TreeNode(yylineno,'CALL', [$1, $3]);`
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
}
module.exports = grammar;