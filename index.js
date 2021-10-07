const fs = require('fs')
const lexicalize = require('./components/Lexer')

const compile = async () => {
	// TODO aprimorar CLI
	const [, , ...args] = process.argv
	const path = args[0]
	try {
		const data = fs.readFileSync(path, 'utf-8')
		const [tokens, hasErrors] = await lexicalize(data)
		// console.log(output)
	} catch (err) {
		if (err.code === 'ENOENT') console.error('Erro: Arquivo de entrada inválido')
		else console.error('Erro desconhecido')
	}
}

compile()
