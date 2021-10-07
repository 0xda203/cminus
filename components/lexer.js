const Lexer = require('flex-js')

const lexer = new Lexer()

var noLines = 1
var withErrors = false

lexer.addRule(/[\n]/, _ => {
	noLines++
}) // Quebra de linhas

lexer.addRule(/ +/, lexeme => ({ lexeme: lexeme.text, tokenName: 'whitespace', tokenAttribute: '', line: noLines })) // Espaços

lexer.addRule(/(else|if|int|return|void|while)/, lexeme => ({
	lexeme: lexeme.text,
	tokenName: lexeme.text,
	tokenAttribute: '',
	line: noLines
})) // Palavras-chave

lexer.addRule(/={3,}/, lexeme => ({ lexeme: lexeme.text, tokenName: 'ERROR', tokenAttribute: '', line: noLines })) // ===

lexer.addRule(/[0-9]+/, lexeme => ({ lexeme: lexeme.text, tokenName: 'NUM', tokenAttribute: '', line: noLines })) // Número
lexer.addRule(/[a-zA-Z]+[0-9]*/, lexeme => ({
	lexeme: lexeme.text,
	tokenName: 'ID',
	tokenAttribute: '',
	line: noLines
})) // ID

lexer.addRule(/>=/, lexeme => ({ lexeme: lexeme.text, tokenName: '>=', tokenAttribute: 'GE', line: noLines })) // >=
lexer.addRule(/<=/, lexeme => ({ lexeme: lexeme.text, tokenName: '<=', tokenAttribute: 'LE', line: noLines })) // <=
lexer.addRule(/!=/, lexeme => ({ lexeme: lexeme.text, tokenName: '<>', tokenAttribute: 'NE', line: noLines })) // <>
lexer.addRule(/</, lexeme => ({ lexeme: lexeme.text, tokenName: '<', tokenAttribute: 'LT', line: noLines })) // <
lexer.addRule(/>/, lexeme => ({ lexeme: lexeme.text, tokenName: '>', tokenAttribute: 'GT', line: noLines })) // >
lexer.addRule(/==/, lexeme => ({ lexeme: lexeme.text, tokenName: '=', tokenAttribute: 'EQ', line: noLines })) // =

lexer.addRule(/\/\*(\*(?!\/)|[^*])*\*\//) // Ignora comentários

lexer.addStateRule('*', /[;,\*\+\/=()\[\]{}\-]/, lexeme => ({
	lexeme: lexeme.text,
	tokenName: lexeme.text,
	tokenAttribute: lexeme.text,
	line: noLines
})) // Caracteres especiais reconhecidos

lexer.addStateRule('*', /.|\n/, lexeme => {
	withErrors = true
	return {
		lexeme: lexeme.text,
		tokenName: 'ERROR',
		tokenAttribute: '',
		line: noLines
	}
}) // Regra default -> Caracteres inválidos

module.exports = program => {
	lexer.setSource(program)
	return new Promise((resolve, reject) => {
		const arr = []
		let token
		try {
			while ((token = lexer.lex()) !== Lexer.EOF) arr.push(token)
			resolve([arr, withErrors])
		} catch (ex) {
			reject(ex)
		}
	})
}
