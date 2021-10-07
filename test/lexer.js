const assert = require('chai').assert
const expect = require('chai').expect

const lexicalize = require('../components/Lexer')
const fs = require('fs')

// TODO Melhorar escopo de testes
describe('lexer', async () => {
	it('program1 should lexicalize without errors', () => {
		lexicalize(fs.readFileSync('examples/program1.cm')).then(output => {
			const [lexemes, hasErrors] = output
			expect(lexemes).to.be.an('array')
			expect(hasErrors).to.be.false
		})
	})

	it('non-existent program should lexicalize with errors', async () => {
		expect(() => {
			fs.readFileSync('examples/program122.cm').to.throw()
			lexicalize().then(output => {
				const [lexemes, hasErrors] = output
				expect(lexemes).to.be.an('array')
				expect(hasErrors).to.be.true
			})
		})
	})
})
