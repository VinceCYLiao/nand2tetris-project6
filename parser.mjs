import { fs } from "./utils.mjs";

class Parser {
  static A_INSTRUCTION = "A_INSTRUCTION";
  static C_INSTRUCTION = "C_INSTRUCTION";
  static L_INSTRUCTION = "L_INSTRUCTION";
  // read file and remove comments and whitespaces
  constructor(path) {
    this.fileString = fs
      .readFileSync(path, "utf8")
      .split(/(\r\n)+|\n+|\r+/)
      .map((s) => s.replace(/\/\/.+/, "").trim())
      .filter((s) => !/(\r\n)+|\n+|\r+/.test(s) && !(s === ""));

    this.instruction = "";
    this.count = 0;
  }

  hasMoreLines() {
    return this.fileString.length > 0;
  }
  // get next instruction from fileString
  advance() {
    this.instruction = this.fileString.shift();
  }

  instructionType() {
    const ins = this.instruction;
    if (/^@.+/.test(ins)) {
      return Parser.A_INSTRUCTION;
    }
    if (/(.+=.+;.+)|(.+=.+)|(.+;.+)/.test(ins)) {
      return Parser.C_INSTRUCTION;
    }
    if (/^\(.+\)$/.test(ins)) {
      return Parser.L_INSTRUCTION;
    }
  }
  // parse A or L instruction symbol
  symbol() {
    const instructionType = this.instructionType();
    if (instructionType === Parser.L_INSTRUCTION) {
      const reg = /^\(|\)/g;
      return this.instruction.replace(reg, "");
    }
    if (instructionType === Parser.A_INSTRUCTION) {
      const reg = /^@/g;
      return this.instruction.replace(reg, "");
    }
  }

  // parse dest comp, and jump from c instruction
  dest() {
    const reg = /^.+=/g;
    const matched = reg.exec(this.instruction);
    return matched ? matched[0].replace("=", "") : "null";
  }

  comp() {
    const reg = /(^.+=)|(;.+)/g;
    return this.instruction.replace(reg, "");
  }

  jump() {
    const reg = /;.+$/;
    const matched = reg.exec(this.instruction);
    return matched ? matched[0].replace(";", "") : "null";
  }
}

export default Parser;
