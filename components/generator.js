
const DATA_SEGMENT_START_ADDR = 0x10000000;
const WORD_SIZE = 4;

let addr = DATA_SEGMENT_START_ADDR;

const malloc = (size) => {
    if (size <= 0) return;
    addr = addr + size;
    return addr - size;
}

function Generator() {
    let label_count = 0,
        l_cleanup = 0,
        mainIndex = -1,
        endIndex = -1;

    let source = [];

    const writeLine = (line, isFunctionlabel_count = false) => {
        source.push((isFunctionlabel_count ? "" : "\t") + line);
    }

    this.globalGenerate = function (node) {
        while (node) {
            switch (node.name) {
                case `VAR_DECL`:
                case `ARR_DECL`:
                    node.memloc = malloc(WORD_SIZE * node.symbol.size);
                    node.symbol.memloc = node.memloc;
                    node.isGlobal = node.symbol.scope === `global`;
                    break;
                case `FUNC_DECL`:
                    if (node.isNative) break;
                    if (node.identifier === `main`) mainIndex = source.length;
                    else if (mainIndex > -1 && endIndex == -1) {
                        endIndex = source.length;
                        mainIndex = -1;
                    }
                    writeLine(`${node.identifier}:`, true);
                    let param = node.children[1],
                        loc = node.symbol.noParameters * WORD_SIZE;
                    if (param && param.name.startsWith(`PARAM`)) {
                        for (param; !!param; param = param.sibling) {
                            loc = loc - WORD_SIZE;
                            param.symbol.memloc = loc;
                            param.memloc = loc;
                        }
                    }

                    writeLine(`addiu $sp, $sp, ${WORD_SIZE * -10}`)
                    writeLine(`sw $fp, 0($sp)`);

                    for (let i = 0; i < 8; i++)
                        writeLine(`sw $s${i}, ${WORD_SIZE * (i + 1)}($sp)`);

                    writeLine(
                        `sw $ra, ${WORD_SIZE * 9}($sp)`)
                    writeLine(`addiu $fp, $sp, ${WORD_SIZE * 10}`
                    );

                    l_cleanup = label_count++;

                    compound_stmt = node.compound_stmt

                    let updateStack = this.localGeneration(node.compound_stmt, WORD_SIZE * 10, 1);
                    updateStack

                    writeLine(
                        `L${l_cleanup}:`, true)
                    writeLine(`addiu $sp, $fp, ${WORD_SIZE * -10}`)
                    writeLine(`lw $fp, 0($sp)`
                    );

                    for (let i = 0; i < 8; i++)
                        writeLine(`lw $s${i}, ${WORD_SIZE * (i + 1)}($sp)`);

                    writeLine(
                        `lw $ra, ${WORD_SIZE * 9}($sp)`)
                    writeLine(`addiu $sp, $sp, ${WORD_SIZE * 10
                        }`
                    );

                    if (node.identifier === `main`) {
                        writeLine(`li $v0, 10`);
                        writeLine(`syscall`);
                    } else {
                        writeLine(`jr $ra`);
                    }

                    break;
            }

            node = node.sibling;
        }
    }

    this.localGeneration = function (node, currStack, visitSibling) {
        while (node) {
            switch (node.name) {
                case `VAR_DECL`:
                    writeLine(`addiu $sp, $sp, ${-WORD_SIZE}`);
                    currStack = currStack + WORD_SIZE;
                    node.memloc = -currStack;
                    node.symbol.memloc = node.memloc;
                    break;
                case `ARR_DECL`:

                    writeLine(`addiu $sp, $sp, ${-WORD_SIZE * node.symbol.size}`);
                    node.memloc = -currStack - WORD_SIZE * node.symbol.size;
                    currStack = currStack + WORD_SIZE * node.symbol.size;
                    node.symbol.memloc = node.memloc;
                    break;
                case `COMPOUND_STMT`:

                    let updateStack = currStack;
                    updateStack = this.localGeneration(node.local_decl, updateStack, 1);
                    this.localGeneration(node.stmt_list, updateStack, 1)

                    writeLine(`addiu $sp, $sp, ${updateStack - currStack}`);
                    break;
                case `SELECT_STMT`:
                    this.localGeneration(node.expr, currStack, 0)
                    let l_exit = label_count++, l_false = label_count++;
                    writeLine(`beqz $v0, L${l_false}`);
                    this.localGeneration(node.if_stmt, currStack, 1)
                    writeLine(`j L${l_exit}`)
                    writeLine(`L${l_false}:`, true);
                    this.localGeneration(node.else_stmt, currStack, 1)
                    writeLine(`L${l_exit}:`, true);
                    break;
                case `ITERATION_STMT`:
                    let l_cmp = label_count++,
                        l_loop = label_count++;
                    writeLine(`j L${l_cmp}`)
                    writeLine(`L${l_loop}:`, true);
                    this.localGeneration(node.compound_stmt, currStack, 1)
                    writeLine(`L${l_cmp}:`, true);
                    this.localGeneration(node.while_expr, currStack, 0)
                    writeLine(`bnez $v0, L${l_loop}`);
                    break;
                case `RETURN_STMT`:
                    let ret_expr = node.children[0];
                    if (ret_expr) {
                        this.localGeneration(ret_expr, currStack, 0)
                    }
                    writeLine(`j L${l_cleanup}`);
                    break;
                case `ASSIGN`:
                    let assign_var = node.children[0],
                        assign_expr = node.children[1];
                    this.localGeneration(assign_expr, currStack, 0)
                    // console.log(assign_var)
                    if (assign_var.symbol.isArray) {
                        writeLine(`move $s1, $v0`);
                        this.localGeneration(assign_var.arr_expr, currStack, 0)
                        writeLine(`li $s0, ${WORD_SIZE}`)
                        writeLine(`mul $s0, $v0, $s0`);
                        this.localGeneration(assign_var.arr_identifier, currStack, 0)
                        writeLine(`add $v0, $v0, $s0`)
                        writeLine(`sw $s1, 0($v0)`)
                        writeLine(`move $v0, $s1`);
                    } else {
                        writeLine(
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
                    this.localGeneration(node.left, currStack, 0)
                    writeLine(`addiu $sp, $sp, -${WORD_SIZE}`)
                    writeLine(`sw $v0, 0($sp)`);
                    currStack = currStack + WORD_SIZE;
                    this.localGeneration(node.right, currStack, 0)
                    writeLine(`lw $s0, 0($sp)`)
                    writeLine(`addiu $sp, $sp, ${WORD_SIZE}`);
                    currStack = currStack - WORD_SIZE;
                    if (node.name == `<`) writeLine(`slt $v0, $s0, $v0`);
                    else if (node.name == `<=`) writeLine(`sle $v0, $s0, $v0`);
                    else if (node.name == `>`) writeLine(`sgt $v0, $s0, $v0`);
                    else if (node.name == `>=`) writeLine(`sge $v0, $s0, $v0`);
                    else if (node.name == `==`) writeLine(`seq $v0, $s0, $v0`);
                    else if (node.name == `!=`) writeLine(`sne $v0, $s0, $v0`);
                    break;
                case `+`:
                case `-`:
                    this.localGeneration(node.left, currStack, 0)
                    writeLine(`addiu $sp, $sp, -${WORD_SIZE}`)
                    writeLine(`sw $v0, 0($sp)`);
                    currStack = currStack + WORD_SIZE;
                    this.localGeneration(node.right, currStack, 0)
                    writeLine(`lw $s0, 0($sp)`)
                    writeLine(`addiu $sp, $sp, ${WORD_SIZE}`);
                    currStack = currStack - WORD_SIZE;
                    writeLine(`${node.name === `+` ? `add` : `sub`} $v0, $s0, $v0`);
                    break;
                case `*`:
                case `/`:

                    this.localGeneration(node.left, currStack, 0)
                    writeLine(`addiu $sp, $sp, -${WORD_SIZE}`)
                    writeLine(`sw $v0, 0($sp)`);
                    currStack = currStack + WORD_SIZE;
                    this.localGeneration(node.right, currStack, 0)
                    writeLine(`lw $s0, 0($sp)`)
                    writeLine(`addiu $sp, $sp, ${WORD_SIZE}`);
                    currStack = currStack - WORD_SIZE;
                    writeLine(`${node.name === `*` ? `mul` : `div`} $v0, $s0, $v0`);
                    break;
                case `CALL`:
                    let loc = 0, args_list = node.args_list;
                    if (node.symbol.identifier === `input`) {
                        writeLine(
                            `li $v0, 4`)
                        writeLine(`la $a0, read_str`)
                        writeLine(`syscall`)
                        writeLine(`li $v0, 5`)
                        writeLine(`syscall`
                        );
                    } else if (node.symbol.identifier === `output`) {
                        writeLine(
                            `move $t0, $v0`)
                        writeLine(`li $v0, 4`)
                        writeLine(`la $a0, print`)
                        writeLine(`syscall`)
                        writeLine(`move $v0, $t0`
                        );

                        this.localGeneration(args_list, currStack + loc, 1)
                        writeLine(
                            `move $a0, $v0`)
                        writeLine(`li $v0, 1`)
                        writeLine(`syscall`)
                        writeLine(`li $v0, 4`)
                        writeLine(`la $a0, newline`)
                        writeLine(`syscall`
                        );
                    } else {
                        while (args_list) {

                            this.localGeneration(args_list, currStack + loc, 0)
                            writeLine(`addiu $sp, $sp, ${-WORD_SIZE}`)
                            writeLine(`sw $v0, 0($sp)`);
                            loc = loc + WORD_SIZE;


                            args_list = args_list.sibling;
                        }
                        writeLine(`jal ${node.symbol.identifier}`)
                        writeLine(`addiu $sp, $sp, ${loc}`);
                    }
                    break;
                case `ARR_VAR`:
                    let arr_var_identifier = node.children[0],
                        arr_var_expr = node.children[1];

                    this.localGeneration(arr_var_expr, currStack, 0)
                    writeLine(`li $s0, ${WORD_SIZE}`)
                    writeLine(`mul $s0, $v0, $s0`);
                    this.localGeneration(arr_var_identifier, currStack, 0)
                    writeLine(`add $v0, $v0, $s0`)
                    writeLine(`lw $v0, 0($v0)`);
                    break;
                case `IDENTIFIER`:
                    if (node.symbol.isArray) {
                        writeLine(
                            node.symbol.scope === `global`
                                ? `li $v0, ${node.symbol.memloc}`
                                : `addiu $v0, $fp, ${node.symbol.memloc}`
                        );
                        if (node.symbol.isParam) {
                            writeLine(`lw $v0, 0($v0)`);

                        }
                    } else {
                        writeLine(
                            node.symbol.scope === `global`
                                ? `lw $v0, ${node.symbol.memloc}`
                                : `lw $v0, ${node.symbol.memloc}($fp)`
                        );
                    }
                    break;
                case `CONSTANT`:
                    writeLine(`li $v0, ${node.value}`);
                    break;
            }



            node = visitSibling ? node.sibling : undefined;
        }

        return currStack;
    }

    this.generate = function (parseTree) {

        const init = [
            ".data",
            'newline: .asciiz "\\n"',
            'print: .asciiz "Output : "',
            'read_str: .asciiz "Input : "\n\n.text\n',
        ];

        this.globalGenerate(parseTree);

        const main = source.slice(mainIndex, endIndex < 0 ? source.length : endIndex);
        source = source
            .slice(0, mainIndex)
            .concat(
                source.slice(endIndex < 0 ? source.length : endIndex - 1, source.length)
            );

        return init.concat(main).concat(source).join(`\n`);
    }

}

module.exports = Generator;


