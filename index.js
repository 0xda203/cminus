const cc = require("node-console-colors");
const Compiler = require('./compiler')
const fs = require('fs');
const util = require('util');

const writeToFile = (file, text) => util.promisify(fs.writeFile)(file, text);

function main() {
	const [, , ...args] = process.argv;
	let [inputFile, outputFile] = args;
	outputFile = outputFile || inputFile.split(".")[0] + "." + "asm";

	try {
		const data = fs.readFileSync(inputFile, "utf-8").replace(/\r/g, "");
		const compiler = new Compiler();
		const [errors, generatedCode] = compiler.compile(data);
		if (errors) {
			console.error(cc.set("fg_red", `Failed to compile with ${errors} error${errors > 1 ? "s" : ""}.`));
		} else {
			console.error(cc.set("fg_green", "Compiled successfully."));
			writeToFile(outputFile, generatedCode);
			console.error(cc.set("fg_white", `File saved in ${outputFile}`));
		}
	} catch (err) {
		console.log(err);
		if (err.code === "ENOENT")
			console.error(cc.set("fg_dark_red", "Erro: Arquivo de entrada inválido."));
		else console.error(cc.set("fg_dark_red", err.name + ": " + err.message));
	}
}

if (require.main === module) {
	main();
}