const Lexer = require('flex-js')

const lexer = new Lexer()

var noLines = 1

lexer.addRule(/[\n]/, _ => {
	noLines++
}) // Quebra de linhas

lexer.addRule(/ +/, lexeme => ({ lexeme: lexeme.text, tokenName: 'whitespace', tokenAttribute: '' })) // Espaços

lexer.addRule(/(else|if|int|return|void|while)/, lexeme => ({
	lexeme: lexeme.text,
	tokenName: lexeme.text,
	tokenAttribute: ''
})) // Palavras-chave

lexer.addRule(/={3,}/, lexeme => ({ lexeme: lexeme.text, tokenName: 'ERROR', tokenAttribute: noLines })) // ===

lexer.addRule(/[0-9]+/, lexeme => ({ lexeme: lexeme.text, tokenName: 'NUM', tokenAttribute: '' })) // Número
lexer.addRule(/[a-zA-Z]+[0-9]*/, lexeme => ({ lexeme: lexeme.text, tokenName: 'ID', tokenAttribute: '' })) // ID

lexer.addRule(/>=/, lexeme => ({ lexeme: lexeme.text, tokenName: '>=', tokenAttribute: 'GE' })) // >=
lexer.addRule(/<=/, lexeme => ({ lexeme: lexeme.text, tokenName: '<=', tokenAttribute: 'LE' })) // <=
lexer.addRule(/!=/, lexeme => ({ lexeme: lexeme.text, tokenName: '<>', tokenAttribute: 'NE' })) // <>
lexer.addRule(/</, lexeme => ({ lexeme: lexeme.text, tokenName: '<', tokenAttribute: 'LT' })) // <
lexer.addRule(/>/, lexeme => ({ lexeme: lexeme.text, tokenName: '>', tokenAttribute: 'GT' })) // >
lexer.addRule(/==/, lexeme => ({ lexeme: lexeme.text, tokenName: '=', tokenAttribute: 'EQ' })) // =

lexer.addRule(/\/\*(.|\s)*\*\//) // Ignora comentários

lexer.addStateRule('*', /[;,\*\+\/=()\[\]{}\-]/, lexeme => ({
	lexeme: lexeme.text,
	tokenName: lexeme.text,
	tokenAttribute: lexeme.text
})) // Caracteres especiais reconhecidos

lexer.addStateRule('*', /.|\n/, lexeme => ({ lexeme: lexeme.text, tokenName: 'ERROR', tokenAttribute: noLines })) // Regra default -> Caracteres inválidos

module.exports = program => {
	lexer.setSource(program)
	return new Promise((resolve, reject) => {
		const arr = []
		var token
		while ((token = lexer.lex()) !== Lexer.EOF) {
			arr.push(token)
		}
		resolve(arr)
	})
}
