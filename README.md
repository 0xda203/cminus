# Projeto de Compilador C-

Projeto de Compilador da linguagem C- descrita no livro "Compilers: principles, techniques, & tools" para a disciplina ACH2087 - Construção de compiladores (2021), ministrado pelo prof. Dr. Marcos Lordello Chaim. O programa faz uso da biblioteca [flex.js](https://www.npmjs.com/package/flex-js) para criação do lexer e da biblioteca [jison](https://github.com/lahmatiy/jison) para construção do parser.

## Instalação

Para executar o programa em sua máquina, clone o repositório em sua máquina e execute os comandos abaixo. Antes, certifique-se de que o Node.js está instalado.

```bash
  git clone git@github.com/0xfe2f/cminus.git
  cd cminus-main
  npm install
```

## Utilização básica

```bash
  node index.js programs/program1.cm
```

## Testes

```bash
  npm run test
```

## Componentes implementados

| Componente           | Status |
| -------------------- | ------ |
| Lexer                | ✅     |
| Parser               | ✅     |
| Analisador semântico | ❌     |
| Otimização           | ❌     |
| Geração de código    | ❌     |

## Autores

Gabriel Rodrigues Santos
Email: <gabrsn1@usp.br>

Caio Valverde Colaneri
Email: <caio.colaneri@usp.br>
