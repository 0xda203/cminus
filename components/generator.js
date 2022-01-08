/* O segmento de dados em MIPS começa em 0x10000000, como descrito por Patterson & Henessey (2014, p.104)  */
let addr = 0x10000000,
    label = 0,
    l_cleanup = 0,
    mainIndex = -1,
    endIndex = -1;
const WORD_SIZE = 4;
let source = [];

function allocateMemory(size) {
    if (size <= 0) return;
    addr = addr + size;
    return addr - size;
}

function generate(tree) {
    while (tree) {
        switch (tree.name) {
            case `VAR_DECL`:
            case `ARR_DECL`:
                tree.memloc = allocateMemory(WORD_SIZE * tree.size);
                // console.log(tree.isArray, tree.memloc, tree.identifier);
                tree.symbol.memloc = tree.memloc;
                tree.isGlobal = tree.scope === `global`;
                break;
            case `FUNC_DECL`:
                if (tree.isNative) break;
                if (tree.identifier === `main`) mainIndex = source.length;
                else if (mainIndex > -1 && endIndex == -1) {
                    endIndex = source.length;
                    mainIndex = -1;
                }
                source.push(`${tree.identifier}:`);
                let param = tree[tree.name].children[1],
                    loc = tree.no_parameters * WORD_SIZE;
                if (param && param.name.startsWith(`PARAM`)) {
                    for (param; param; param = param.sibling) {
                        loc = loc - WORD_SIZE;
                        param.symbol.memloc = loc;
                        param.memloc = loc;
                    }
                }

                source.push(`addiu $sp, $sp, ${WORD_SIZE * -10}\nsw $fp, 0($sp)`);

                for (let i = 0; i < 8; i++)
                    source.push(`sw $s${i}, ${WORD_SIZE * (i + 1)}($sp)`);

                source.push(
                    `sw $ra, ${WORD_SIZE * 9}($sp)\naddiu $fp, $sp, ${WORD_SIZE * 10}`
                );

                l_cleanup = label++;

                compound_stmt =
                    tree[tree.name].children[tree[tree.name].children.length - 1];
                // console.log(
                //   compound_stmt[compound_stmt.name].children.map((c) => c.name)
                // );

                compound_stmt.local_decl =
                    compound_stmt[compound_stmt.name].children[0];

                compound_stmt.stmt_list = compound_stmt[compound_stmt.name].children[1];

                let updateStack = localGeneration(compound_stmt, WORD_SIZE * 10, 1);
                if (updateStack != WORD_SIZE * 10) {
                }

                source.push(
                    `L${l_cleanup}:\naddiu $sp, $fp, ${WORD_SIZE * -10}\nlw $fp, 0($sp)`
                );

                for (let i = 0; i < 8; i++)
                    source.push(`lw $s${i}, ${WORD_SIZE * (i + 1)}($sp)`);

                source.push(
                    `lw $ra, ${WORD_SIZE * 9}($sp)\naddiu $sp, $sp, ${WORD_SIZE * 10
                    }`
                );

                if (tree.identifier === `main`) {
                    source.push(`li $v0, 10`);
                    source.push(`syscall`);
                } else {
                    source.push(`jr $ra`);
                }

                break;
        }

        tree = tree.sibling;
    }
}

function localGeneration(tree, currStack, travSibling) {
    while (tree) {
        switch (tree.name) {
            case `VAR_DECL`:
                source.push(`addiu $sp, $sp, ${-WORD_SIZE}`);
                currStack = currStack + WORD_SIZE;
                tree.memloc = -currStack;
                tree.symbol.memloc = tree.memloc;
                break;
            case `ARR_DECL`:
                // console.log(tree.size)
                source.push(`addiu $sp, $sp, ${-WORD_SIZE * tree.size}`);
                tree.memloc = -currStack - WORD_SIZE * tree.size;
                currStack = currStack + WORD_SIZE * tree.size;
                tree.symbol.memloc = tree.memloc;
                break;
            case `COMPOUND_STMT`:
                // console.log(tree.local_stmt.name);
                let updateStack = currStack;
                updateStack = localGeneration(tree.local_decl, updateStack, 1);
                if (localGeneration(tree.stmt_list, updateStack, 1) != updateStack) {
                }
                if (updateStack < currStack) {
                }
                // console.log(updateStack - currStack);
                source.push(`addiu $sp, $sp, ${updateStack - currStack}`);
                break;
            case `SELECT_STMT`:
                let expr = tree[tree.name].children[0],
                    if_stmt = tree[tree.name].children[1],
                    else_stmt = tree[tree.name].children[2];

                if (if_stmt.name === `COMPOUND_STMT`) {
                    if_stmt.local_decl = if_stmt[if_stmt.name].children[0];
                    if_stmt.stmt_list = if_stmt[if_stmt.name].children[1];
                }

                if (else_stmt && else_stmt.name === `COMPOUND_STMT`) {
                    else_stmt.local_decl = else_stmt[else_stmt.name].children[0];
                    else_stmt.stmt_list = else_stmt[else_stmt.name].children[1];
                }

                if (localGeneration(expr, currStack, 0) != currStack) {
                }
                (l_exit = label++), (l_false = label++);
                source.push(`beqz $v0, L${l_false}`);
                if (localGeneration(if_stmt, currStack, 1) != currStack) {
                }
                source.push(`j L${l_exit}\nL${l_false}:`);
                if (localGeneration(else_stmt, currStack, 1) != currStack) {
                }
                source.push(`L${l_exit}:`);
                break;
            case `ITERATION_STMT`:
                let l_cmp = label++,
                    l_loop = label++,
                    while_expr = tree[tree.name].children[0],
                    compound_stmt = tree[tree.name].children[1];

                compound_stmt.local_decl =
                    compound_stmt[compound_stmt.name].children[0];

                compound_stmt.stmt_list = compound_stmt[compound_stmt.name].children[1];

                source.push(`j L${l_cmp}\nL${l_loop}:`);
                if (localGeneration(compound_stmt, currStack, 1) != currStack) {
                }
                source.push(`L${l_cmp}:`);
                if (localGeneration(while_expr, currStack, 0) != currStack) {
                }
                source.push(`bnez $v0, L${l_loop}`);
                break;
            case `RETURN_STMT`:
                let ret_expr = tree[tree.name].children[0];
                if (ret_expr) {
                    if (localGeneration(ret_expr, currStack, 0) != currStack) {
                    }
                }
                source.push(`j L${l_cleanup}`);
                break;
            case `ASSIGN`:
                let assign_var = tree[tree.name].children[0],
                    assign_expr = tree[tree.name].children[1];
                if ((localGeneration(assign_expr), currStack, 0) != currStack) {
                }
                if (assign_var.symbol.isArray) {
                    source.push(`move $s1, $v0`);
                    let arr_identifier = assign_var[assign_var.name].children[0],
                        arr_expr = assign_var[assign_var.name].children[1];
                    if (localGeneration(arr_expr, currStack, 0) != currStack) {
                    }
                    source.push(`li $s0, ${WORD_SIZE}\nmul $s0, $v0, $s0`);
                    if (localGeneration(arr_identifier, currStack, 0) != currStack) {
                    }
                    source.push(`add $v0, $v0, $s0\nsw $s1, 0($v0)\nmove $v0, $s1`);
                } else {
                    source.push(
                        assign_var.scope === `global`
                            ? `sw $v0, ${assign_var.symbol.memloc}`
                            : `sw $v0, ${assign_var.symbol.memloc}($fp)`
                    );
                }

                break;

            case `>`:
            case `<`:
            case `>=`:
            case `<=`:
            case `==`:
            case `!=`:
                let term = tree[tree.name].children[0],
                    factor = tree[tree.name].children[1];

                if (localGeneration(term, currStack, 0) != currStack) {
                }
                source.push(`addiu $sp, $sp, -${WORD_SIZE}\nsw $v0, 0($sp)`);
                currStack = currStack + WORD_SIZE;
                if (localGeneration(factor, currStack, 0) != currStack) {
                }
                source.push(`lw $s0, 0($sp)\naddiu $sp, $sp, ${WORD_SIZE}`);
                currStack = currStack - WORD_SIZE;
                if (tree.name == `<`) source.push(`slt $v0, $s0, $v0`);
                else if (tree.name == `<=`) source.push(`sle $v0, $s0, $v0`);
                else if (tree.name == `>`) source.push(`sgt $v0, $s0, $v0`);
                else if (tree.name == `>=`) source.push(`sge $v0, $s0, $v0`);
                else if (tree.name == `==`) source.push(`seq $v0, $s0, $v0`);
                else if (tree.name == `!=`) source.push(`sne $v0, $s0, $v0`);
                break;
            case `+`:
            case `-`:
                let terms = tree[tree.name].children[0],
                    factors = tree[tree.name].children[1];
                if (localGeneration(terms, currStack, 0) != currStack) {
                }
                source.push(`addiu $sp, $sp, -${WORD_SIZE}\nsw $v0, 0($sp)`);
                currStack = currStack + WORD_SIZE;
                if (localGeneration(factors, currStack, 0) != currStack) {
                }
                source.push(`lw $s0, 0($sp)\naddiu $sp, $sp, ${WORD_SIZE}`);
                currStack = currStack - WORD_SIZE;
                source.push(`${tree.name === `+` ? `add` : `sub`} $v0, $s0, $v0`);
                break;
            case `*`:
            case `/`:
                let termm = tree[tree.name].children[0],
                    factorm = tree[tree.name].children[1];
                if (localGeneration(termm, currStack, 0) != currStack) {
                }
                source.push(`addiu $sp, $sp, -${WORD_SIZE}\nsw $v0, 0($sp)`);
                currStack = currStack + WORD_SIZE;
                if (localGeneration(factorm, currStack, 0) != currStack) {
                }
                source.push(`lw $s0, 0($sp)\naddiu $sp, $sp, ${WORD_SIZE}`);
                currStack = currStack - WORD_SIZE;
                source.push(`${tree.name === `*` ? `mul` : `div`} $v0, $s0, $v0`);
                break;
            case `CALL`:
                let loc = 0;
                args_list = tree[tree.name].children[1];
                if (tree.identifier === `input`) {
                    source.push(
                        `li $v0, 4\nla $a0, read_str\nsyscall\nli $v0, 5\nsyscall`
                    );
                } else if (tree.identifier === `output`) {
                    source.push(
                        `move $t0, $v0\nli $v0, 4\nla $a0, print\nsyscall\nmove $v0, $t0`
                    );
                    if (
                        localGeneration(args_list, currStack + loc, 1) !=
                        currStack + loc
                    ) {
                    }
                    source.push(
                        `move $a0, $v0\nli $v0, 1\nsyscall\nli $v0, 4\nla $a0, newline\nsyscall`
                    );
                } else {
                    while (args_list) {
                        if (
                            localGeneration(args_list, currStack + loc, 0) !=
                            currStack + loc
                        ) {
                        }
                        source.push(`addiu $sp, $sp, ${-WORD_SIZE}\nsw $v0, 0($sp)`);
                        loc = loc + WORD_SIZE;
                        // console.log(args_list.name, tree.identifier);

                        args_list = args_list.sibling;
                    }
                    source.push(`jal ${tree.identifier}\naddiu $sp, $sp, ${loc}`);
                }
                break;
            case `ARR_VAR`:
                let arr_var_identifier = tree[tree.name].children[0],
                    arr_var_expr = tree[tree.name].children[1];
                if (localGeneration(arr_var_expr, currStack, 0) != currStack) {
                }
                source.push(`li $s0, ${WORD_SIZE}\nmul $s0, $v0, $s0`);
                if (localGeneration(arr_var_identifier, currStack, 0) != currStack) {
                }
                source.push(`add $v0, $v0, $s0\nlw $v0, 0($v0)`);
                break;
            case `IDENTIFIER`:
                if (tree.isArray) {
                    // console.log(tree.symbol.memloc, tree.identifier);
                    source.push(
                        tree.scope === `global`
                            ? `li $v0, ${tree.symbol.memloc}`
                            : `addiu $v0, $fp, ${tree.symbol.memloc}`
                    );
                    if (tree.isParam) {
                        source.push(`lw $v0, 0($v0)`);
                        // console.log(tree.name, tree.identifier, tree.scope);
                    }
                } else {
                    source.push(
                        tree.scope === `global`
                            ? `lw $v0, ${tree.symbol.memloc}`
                            : `lw $v0, ${tree.symbol.memloc}($fp)`
                    );
                }
                break;
            case `CONSTANT`:
                source.push(`li $v0, ${tree.value}`);
            //   break;
            // default:
            //   console.error(tree.name);
            //   break;
        }

        // console.log(tree.name, tree.value, travSibling);

        tree = travSibling ? tree.sibling : undefined;
    }
    return currStack;
}

module.exports = function (tree) {
    const init = [
        ".data",
        'newline: .asciiz "\\n"',
        'print: .asciiz "Output : "',
        'read_str: .asciiz "Input : "\n\n.text',
    ];

    generate(tree);

    const main = source.slice(mainIndex, endIndex < 0 ? source.length : endIndex);
    source = source
        .slice(0, mainIndex)
        .concat(
            source.slice(endIndex < 0 ? source.length : endIndex - 1, source.length)
        );

    return init.concat(main).concat(source).join(`\n`);
};
