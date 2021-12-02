const fs = require('fs')
const Parser = require('./components/Parser')
const { Lexer, TOKENS}  = require('./components/Lexer')

const compile = async () => {
	// TODO aprimorar CLI
	const [, , ...args] = process.argv
	const path = args[0]
	try {
		const data = fs.readFileSync(path, 'utf-8')
		const parser = Parser(Lexer, TOKENS);
		const AST = parser.parse(data);
		console.log(AST.toString())
	} catch (err) {
		if (err.code === 'ENOENT') console.error('Erro: Arquivo de entrada inválido')
		else console.error(err)
	}
}

compile()
