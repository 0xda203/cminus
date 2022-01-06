# Projeto de Compilador C-

Projeto de Compilador da linguagem C- descrita no livro "Compilers: principles, techniques, & tools" para a disciplina ACH2087 - Construção de compiladores (2021), ministrado pelo prof. Dr. Marcos Lordello Chaim. O programa faz uso da biblioteca [jison-lex](https://github.com/zaach/jison-lex) para criação do lexer e da biblioteca [jison](https://github.com/lahmatiy/jison) para construção do parser. A biblioteca [treeify](https://github.com/notatestuser/treeify) foi utilizada para melhor visualização da árvore da abstrata no console.

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
| Analisador semântico | ✅     |
| Geração de Código    | ⚠️     |
| Otimização           | ❌     |

## Autores

Gabriel Rodrigues Santos
Email: <gabrsn1@usp.br>

Caio Valverde Colaneri
Email: <caio.colaneri@usp.br>
