const cc = require("node-console-colors");
const Compiler = require('./compiler')
const fs = require('fs');
const util = require('util');

const writeToFile = (file, text) => util.promisify(fs.writeFile)(file, text);

function main() {
	const [, , ...args] = process.argv;
	const [inputFile, outputFile] = args;

	try {
		const data = fs.readFileSync(inputFile, "utf-8").replace(/\r/g, "");
		const compiler = new Compiler();
		const [message, generatedCode] = compiler.compile(data);
		if (message) {
			console.log(message);
		} else {
			console.error(cc.set("fg_white", "Compiled with 0 errors"));
			writeToFile(outputFile, generatedCode);
			console.error(cc.set("fg_green", `Output file saved in ${outputFile}`));
		}
	} catch (err) {
		if (err.code === "ENOENT")
			console.error(cc.set("fg_dark_red", "Erro: Arquivo de entrada inválido."));
		else console.error(cc.set("fg_dark_red", err.name + ": " + err.message));
	}
}

if (require.main === module) {
	main();
}