const fs = require('fs')
const cc = require("node-console-colors");
const Parser = require('./components/Parser')
const { Lexer }  = require('./components/Lexer')

const compile = async () => {
	const [, , ...args] = process.argv
	const path = args[0]
	try {
		const data = fs.readFileSync(path, 'utf-8')
		const lines = data.toString().split('\n')

		const showError = require('./util/errors')(lines);

		const parser = Parser(Lexer);
		const ast = parser.parse(data);
	} catch (err) {
		if (err.code === 'ENOENT') console.error(cc.set("fg_dark_red", 'Erro: Arquivo de entrada inválido.'))
		else console.error(cc.set("fg_dark_red", err.name + ": " + err.message))
	}
}

compile()
