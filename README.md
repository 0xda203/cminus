# Projeto de Compilador C-

Projeto de Compilador da linguagem C- descrita no livro "Compiler Construction: Principles and Practice" para a disciplina ACH2087 - Construção de compiladores (2021), ministrado pelo prof. Dr. Marcos Lordello Chaim. O programa faz uso da biblioteca [jison-lex](https://github.com/zaach/jison-lex) para criação do lexer e da biblioteca [jison](https://github.com/lahmatiy/jison) para construção do parser.

## Instalação

Para executar o programa em sua máquina, clone o repositório em sua máquina e execute os comandos abaixo. Antes, certifique-se de que o Node.js está instalado.

```bash
  git clone git@github.com/0xda203/cminus.git
  cd cminus-main
  yarn
```

## Utilização básica

```bash
  yarn compile examples/lauden_exemplo.c-
```

## Componentes implementados

| Componente           | Status |
| -------------------- | ------ |
| Lexer                | ✅     |
| Parser               | ✅     |
| Analisador semântico | ✅     |
| Geração de Código    | ✅     |
| Otimização           | ❌     |

## Autores

Gabriel Rodrigues
Caio Valverde Colaneri
