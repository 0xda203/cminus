const { Parser: JisonParser } = require(`jison`);
const grammar = require('./grammar')

class ParserError extends Error {
  constructor(message = "", ...args) {
    super(message, ...args);
    this.name = "ParserError";
  }
}

/*
  Essas variáveis precisam estar acessíveis no contexto global, caso contrário o Jison não conhece reconhecê-las, visto que não há nem sequer
  suporte para funções auxiliares na biblioteca
*/
global.ParserError = ParserError;

function Parser(lexer) {
  const parser = new JisonParser(grammar, { type: "lalr", debug: false, enableDebugLogs: false, reportStats: false });
  parser.lexer = lexer;

  parser.yy.parseError = function (err, hash) {
    if (!((!hash.expected || hash.expected.indexOf("';'") >= 0) && (hash.token === 'RBRACE' || hash.token === 'ERROR' || parser.yy.lineBreak || parser.yy.lastLineBreak || hash.token === 1))) {
      const message = `Unrecognized expression '${hash.text}' at line ${hash.line}`;
      throw new ParserError(this.showError(hash.text, hash.loc.first_line - 1, message, false, ""));
    }
  };

  return parser;
}

module.exports = Parser;