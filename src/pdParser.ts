import fs from "fs";
import { Option, Some, None } from "ts-results";

export enum InputType {
  hsl,
  bng,
}

const InputList = ["hsl", "bng"];

export interface PdInput {
  t: string;
  nodeId: number;
  objectType: InputType;
  connectedTo: Array<{
    nodeId: number;
    inletId: number;
  }>;
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

  private isInput(): boolean {
    return (
      this.tokens[this.cur_line][0] === "#X" &&
      this.tokens[this.cur_line][1] === "obj" &&
      InputList.includes(this.tokens[this.cur_line][4])
    );
  }

  private isConnect(): boolean {
    return (
      this.tokens[this.cur_line][0] === "#X" &&
      this.tokens[this.cur_line][1] === "connect"
    );
  }

  private isObject(): boolean {
    return (
      this.tokens[this.cur_line][0] === "#X" &&
      this.tokens[this.cur_line][1] === "obj"
    );
  }

  parse(): Array<PdInput> {
    const inlets: Array<PdInput> = [];
    const connects: Array<PdConnect> = [];
    while (this.cur_line < this.tokens.length) {
      const line = this.lineParse();
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
      const connectedTo = connects
        .filter((connect) => connect.inputNodeId === inlet.nodeId)
        .map((connect) => ({
          nodeId: connect.outputNodeId,
          inletId: connect.outputPortletId,
        }));
      return { ...inlet, connectedTo };
    });

    return inletsWithConnections;
  }

  lineParse(): Option<PdInput | PdConnect> {
    if (this.isInput()) {
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
    const inputType = this.tokens[this.cur_line][4];
    if (inputType === "hsl") {
      return this.parseHslInput();
    } else if (inputType === "bng") {
      return this.parseBangInput();
    } else {
      throw new Error("Unknown inlet type");
    }
  }

  private parseHslInput(): PdInput {
    const name = this.tokens[this.cur_line][13];
    const min = Number(this.tokens[this.cur_line][7]);
    const max = Number(this.tokens[this.cur_line][8]);
    const inlet: PdInput = {
      t: PdInputT,
      nodeId: this.latestNodeId,
      objectType: InputType.hsl,
      connectedTo: [],
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
      connectedTo: [],
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

export const ListPdInputs = (pdFilePath: string): Array<PdInput> => {
  const pdFile = fs.readFileSync(pdFilePath, "utf8");
  const lines = pdFile.split(";").map((line) => line.replace("\n", ""));
  const parser = new PdParser(lines.map((line) => line.split(" ")));
  const parsed: Array<PdInput> = parser.parse();

  return parsed;
};
