import fs from "fs";
import { Option, Some, None } from "ts-results";

export enum InputType {
  hsl,
  bng,
  floatatom,
}

export const InputTypeStr = {
  [InputType.hsl]: "hsl",
  [InputType.bng]: "bng",
  [InputType.floatatom]: "floatatom",
};

export interface PdInput {
  t: string;
  nodeId: number;
  objectType: InputType;
  activePortlets: Array<number>;
  name: string;
  min?: number;
  max?: number;
}
const PdInputT = "PdInput";

interface PdConnect {
  t: string;
  inputNodeId: number;
  inputPortletId: number;
  outputNodeId: number;
  outputPortletId: number;
}
const PdConnectT = "PdConnect";

class PdParser {
  private tokens: Array<Array<string>> = [];
  private cur_line: number = 0;
  private latestNodeId: number = 0;

  constructor(tokens: Array<Array<string>>) {
    this.tokens = tokens;
  }

  // Check if the current line is an input or not
  private isInput(): Option<string> {
    const isBang =
      this.tokens[this.cur_line][0] === "#X" &&
      this.tokens[this.cur_line][1] === "obj" &&
      this.tokens[this.cur_line][4] === "bng";
    if (isBang) {
      return Some("bng");
    }
    const isHsl =
      this.tokens[this.cur_line][0] === "#X" &&
      this.tokens[this.cur_line][1] === "obj" &&
      this.tokens[this.cur_line][4] === "hsl";
    if (isHsl) {
      return Some("hsl");
    }
    const isFloatatom =
      this.tokens[this.cur_line][0] === "#X" &&
      this.tokens[this.cur_line][1] === "floatatom";
    if (isFloatatom) {
      return Some("floatatom");
    }
    return None;
  }

  // Check if the current line is a connection or not
  private isConnect(): boolean {
    return (
      this.tokens[this.cur_line][0] === "#X" &&
      this.tokens[this.cur_line][1] === "connect"
    );
  }

  // Check if the current line is an object or not
  private isObject(): boolean {
    return this.tokens[this.cur_line][0] === "#X";
  }

  // Parse the whole file
  parse(): Array<PdInput> {
    const inlets: Array<PdInput> = [];
    const connects: Array<PdConnect> = [];
    while (this.cur_line < this.tokens.length) {
      const line = this.lineParse();
      // if line is an input
      if (line.some) {
        if (line.val.t === PdInputT) {
          inlets.push(line.val as PdInput);
        } else if (line.val.t === PdConnectT) {
          connects.push(line.val as PdConnect);
        }
      }
      this.cur_line++;
    }

    const inletsWithConnections = inlets.map((inlet) => {
      const connections = connects.filter(
        (connect) => connect.inputNodeId === inlet.nodeId
      );
      const activePortlets = connections.map(
        (connection) => connection.inputPortletId
      );

      return {
        ...inlet,
        activePortlets,
      } as PdInput;
    });

    return inletsWithConnections;
  }

  lineParse(): Option<PdInput | PdConnect> {
    if (this.isInput().some) {
      const inlet = this.parseInput();
      this.latestNodeId += 1;
      return new Some(inlet);
    } else if (this.isConnect()) {
      const connect = this.parseConnect();
      return new Some(connect);
    } else {
      if (this.isObject()) {
        this.latestNodeId += 1;
      }
      return None;
    }
  }

  private parseInput(): PdInput {
    const inputTypeOp = this.isInput();
    if (inputTypeOp.none) {
      throw new Error("parseInput called on non-input line");
    }
    const inputType = inputTypeOp.val;
    if (inputType === "hsl") {
      return this.parseHslInput();
    }
    if (inputType === "bng") {
      return this.parseBangInput();
    }
    if (inputType === "floatatom") {
      return this.parseFloatatomInput();
    }

    throw new Error("Input type not found");
  }

  private parseHslInput(): PdInput {
    const name = this.tokens[this.cur_line][13];
    const min = Number(this.tokens[this.cur_line][7]);
    const max = Number(this.tokens[this.cur_line][8]);
    const inlet: PdInput = {
      t: PdInputT,
      nodeId: this.latestNodeId,
      objectType: InputType.hsl,
      activePortlets: [],
      name,
      min,
      max,
    };

    return inlet;
  }

  private parseBangInput(): PdInput {
    const name = this.tokens[this.cur_line][11];
    return {
      t: PdInputT,
      nodeId: this.latestNodeId,
      objectType: InputType.bng,
      activePortlets: [],
      name,
    };
  }

  private parseFloatatomInput(): PdInput {
    const name = this.tokens[this.cur_line][8];
    return {
      t: PdInputT,
      nodeId: this.latestNodeId,
      objectType: InputType.floatatom,
      activePortlets: [],
      name,
    };
  }

  private parseConnect(): PdConnect {
    const inputNodeId = parseInt(this.tokens[this.cur_line][2]);
    const inputPortletId = parseInt(this.tokens[this.cur_line][3]);
    const outputNodeId = parseInt(this.tokens[this.cur_line][4]);
    const outputPortletId = parseInt(this.tokens[this.cur_line][5]);
    return {
      t: PdConnectT,
      inputNodeId,
      inputPortletId,
      outputNodeId,
      outputPortletId,
    };
  }
}

// from pure data patch, get a list of inputs
export const ListPdInputs = (pdFilePath: string): Array<PdInput> => {
  const pdFile = fs.readFileSync(pdFilePath, "utf8");
  const lines = pdFile.split(";").map((line) => line.replace("\n", ""));
  const parser = new PdParser(lines.map((line) => line.split(" ")));

  return parser.parse();
};
