const fs = require('fs')
const lexicalize = require('./components/Lexer')

const compile = async () => {
	const path = process.argv[2]
	try {
		const data = fs.readFileSync(path, 'utf-8')
		const output = await lexicalize(data)
		// console.log(output)
	} catch (ex) {
		console.error('Erro: Arquivo de entrada inválido')
	}
}

compile()
