const assert = require('chai').assert
const lexicalize = require('../components/Lexer')

describe('lexer', () => {
	it('should lexicalize', async () => {
		const lexemes = await lexicalize('../examples/program1.cm')
		expect(lexemes).to.be.an('array').that.have.lengthOf()
	})

	it('2 * 2 deve ser igual a 8 (nota 0 em matemática)', () => {
		assert.equal(8, 2 * 2)
	})
})
