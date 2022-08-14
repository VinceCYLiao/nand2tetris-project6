import Parser from "./parser.mjs";
import { dest, comp, jump } from "./code.mjs";
import { fs } from "./utils.mjs";

// hack assemble language pre-defined variables for memory location 0~15
const rArray = new Array(16).fill(0).map((num, idx) => num + idx);
const rObj = rArray.reduce((acc, cur) => {
  acc[`R${cur}`] = `${cur}`;
  return acc;
}, {});

// hack assemble language pre-defined variables
const preDefined = {
  ...rObj,
  SP: "0",
  LCL: "1",
  ARG: "2",
  THIS: "3",
  THAT: "4",
  SCREEN: "16384",
  KBD: "24576",
};

// convert variable/label location into 16 bits binary
const toAddress = (number) => {
  const binary = Number(number).toString(2);
  const padNum = 16 - binary.length;
  const padZeros = new Array(padNum).fill("0").join("");
  return padZeros + binary;
};

function assembler(path) {
  const output = [];
  const symboTable = new Map(Object.entries(preDefined));

  // first run: record position of label into symbol table
  const firstPass = new Parser(path);
  let count = 0;
  let variableCount = 16;

  while (firstPass.hasMoreLines()) {
    firstPass.advance();
    const type = firstPass.instructionType();
    if (type === Parser.L_INSTRUCTION) {
      const symbol = firstPass.symbol();
      // the number of count is the next line number of L Instruction
      symboTable.set(symbol, `${count}`);
    } else {
      count += 1;
    }
  }

  // second run: translate each line of instruction into binary code
  const secondPass = new Parser(path);

  while (secondPass.hasMoreLines()) {
    secondPass.advance();
    const type = secondPass.instructionType();
    if (type === Parser.A_INSTRUCTION) {
      const symbol = secondPass.symbol();
      if (!symboTable.get(symbol)) {
        symboTable.set(symbol, variableCount);
        variableCount += 1;
      }
      if (/^[0-9]+$/.test(symbol)) {
        const binaryCode = toAddress(symbol);
        output.push(binaryCode);
      } else {
        const address = symboTable.get(symbol);
        const binaryCode = toAddress(address);
        output.push(binaryCode);
      }
    }
    if (type === Parser.C_INSTRUCTION) {
      const binaryCode = `111${comp(secondPass.comp())}${dest(
        secondPass.dest()
      )}${jump(secondPass.jump())}`;
      output.push(binaryCode);
    }
  }

  const outputString = output.join("\r\n");
  const reg = /[a-zA-Z0-9]+.asm$/;
  const inputFileName = reg.exec(path) ? reg.exec(path)[0] : "";
  const outputFileName = inputFileName.replace(".asm", ".hack");
  fs.writeFileSync(outputFileName, outputString, "utf8");
}

// parse path from cmd input
const path = process.argv[2];
if (!path) throw new Error("not valid path");

assembler(path);
