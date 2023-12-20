import fs from "fs";
import MarkdownIt from "markdown-it";
import { GenWasmPatch } from "./webpd";
import { ListPdInputs, PdInput, InputType, InputTypeStr } from "./pdParser";

// Render UI html
const RenderPdInputHtml = (pdInput: PdInput, prefix: string): string => {
  if (pdInput.objectType === InputType.hsl) {
    return `
<div>
  - ${pdInput.name}:
  <input id="hsl_${prefix}_${pdInput.nodeId}" type="range" min="${pdInput.min}" max="${pdInput.max}" step="1" value="${pdInput.min}"> </input>
</div>
`;
  }
  if (pdInput.objectType === InputType.bng) {
    return `
<div>
  - ${pdInput.name}:
  <button id="bng_${prefix}_${pdInput.nodeId}"> bang </button>
</div>
`;
  }
  if (pdInput.objectType === InputType.floatatom) {
    return `
<div>
  - ${pdInput.name}:
  <input id="floatatom_${prefix}_${pdInput.nodeId}" type="number" value=0> </input>
</div>
`;
  }
  if (pdInput.objectType === InputType.tgl) {
    return `
<div>
  - ${pdInput.name}:
  <input id="tgl_${prefix}_${pdInput.nodeId}" type="checkbox"> </input>
</div>
`;
  }
  if (pdInput.objectType === InputType.nbx) {
    return `
<div>
  - ${pdInput.name}:
  <input id="nbx_${prefix}_${pdInput.nodeId}" type="number" value=0> </input>
</div>
`;
  }
  if (pdInput.objectType === InputType.vsl) {
    return `
<div>
  - ${pdInput.name}:
  <input id="vsl_${prefix}_${pdInput.nodeId}" type="range" min="${pdInput.min}" max="${pdInput.max}" step="1" value="${pdInput.min}"> </input>
</div>
`;
  }
  if (pdInput.objectType === InputType.vradio) {
    return `
<div>
  - ${pdInput.name}:
  ${
    pdInput.numCells === undefined
      ? ""
      : [...Array(pdInput.numCells)].map((_, i) => {
          return `
  <input type="radio" id="vradio_${prefix}_${pdInput.nodeId}_${i}" name="vradio_${prefix}_${pdInput.nodeId}" value="${i}">
  <label for="vradio_${prefix}_${pdInput.nodeId}_${i}">${i}</label>
  `;
        })
  }
</div>
`;
  }
  if (pdInput.objectType === InputType.msg) {
    return `
<div>
  - ${pdInput.name}:
  <button id="msg_${prefix}_${pdInput.nodeId}"> send </button>
</div>
`;
  }

  throw new Error(`unknown input type: ${pdInput.objectType}`);
};

// Render Js argument string
const msgArgStr = (
  pdInput: PdInput,
  isInit: boolean,
  initStr: any,
  prefix: string
): string => {
  if (pdInput.objectType === InputType.hsl) {
    return isInit ? `[${initStr}]` : `[Number(e.target.value)]`;
  }
  if (pdInput.objectType === InputType.bng) {
    return isInit ? `[]` : `["bang"]`;
  }
  if (pdInput.objectType === InputType.floatatom) {
    return isInit ? `[]` : `[Number(e.target.value)]`;
  }
  if (pdInput.objectType === InputType.tgl) {
    return isInit ? `[]` : `[tgl_${prefix}_${pdInput.nodeId}.checked ? 1 : 0]`;
  }
  if (pdInput.objectType === InputType.nbx) {
    return isInit ? `[]` : `[Number(e.target.value)]`;
  }
  if (pdInput.objectType === InputType.vsl) {
    return isInit ? `[${initStr}]` : `[Number(e.target.value)]`;
  }
  if (pdInput.objectType === InputType.vradio) {
    return isInit ? `[${initStr}]` : `[Number(e.target.value)]`;
  }
  if (pdInput.objectType === InputType.msg) {
    return isInit ? `[]` : `[1]`;
  }

  throw new Error(`unknown input type: ${pdInput.objectType}`);
};

// Render Js send msg function
const sendMsgFunctions = (
  pdInput: PdInput,
  prefix: string,
  isInit: boolean,
  initStr: any
): string => {
  let lines = "";
  for (let i = 0; i < pdInput.activePortlets.length; i++) {
    const portletId = pdInput.activePortlets[i];
    lines += `
sendMsgToWebPd_${prefix}("n_0_${pdInput.nodeId}", "${portletId}", ${msgArgStr(
      pdInput,
      isInit,
      initStr,
      prefix
    )});
`;
  }
  return lines;
};

// Render UI html
const RenderPdInputSendMsgFunction = (
  pdInput: PdInput,
  prefix: string
): string => {
  const objectTypeStr = InputTypeStr[pdInput.objectType];

  if (pdInput.objectType === InputType.hsl) {
    return `
const ${objectTypeStr}_${prefix}_${
      pdInput.nodeId
    } = document.querySelector("#${objectTypeStr}_${prefix}_${pdInput.nodeId}")
${objectTypeStr}_${prefix}_${pdInput.nodeId}.oninput = (e) => {
  ${sendMsgFunctions(pdInput, prefix, false, null)}
}
`;
  }
  if (pdInput.objectType === InputType.bng) {
    return `
const ${objectTypeStr}_${prefix}_${
      pdInput.nodeId
    } = document.querySelector("#${objectTypeStr}_${prefix}_${pdInput.nodeId}")
${objectTypeStr}_${prefix}_${pdInput.nodeId}.onclick = () => {
  ${sendMsgFunctions(pdInput, prefix, false, null)}
}
`;
  }
  if (pdInput.objectType === InputType.floatatom) {
    return `
const ${objectTypeStr}_${prefix}_${
      pdInput.nodeId
    } = document.querySelector("#${objectTypeStr}_${prefix}_${pdInput.nodeId}")
${objectTypeStr}_${prefix}_${pdInput.nodeId}.onchange = (e) => {
  ${sendMsgFunctions(pdInput, prefix, false, null)}
}
`;
  }
  if (pdInput.objectType === InputType.tgl) {
    return `
const ${objectTypeStr}_${prefix}_${
      pdInput.nodeId
    } = document.querySelector("#${objectTypeStr}_${prefix}_${pdInput.nodeId}")
${objectTypeStr}_${prefix}_${pdInput.nodeId}.onclick = () => {
  ${sendMsgFunctions(pdInput, prefix, false, null)}
}
`;
  }
  if (pdInput.objectType === InputType.nbx) {
    return `
const ${objectTypeStr}_${prefix}_${
      pdInput.nodeId
    } = document.querySelector("#${objectTypeStr}_${prefix}_${pdInput.nodeId}") 
${objectTypeStr}_${prefix}_${pdInput.nodeId}.onchange = (e) => {
  ${sendMsgFunctions(pdInput, prefix, false, null)}
}
`;
  }
  if (pdInput.objectType === InputType.vsl) {
    return `
const ${objectTypeStr}_${prefix}_${
      pdInput.nodeId
    } = document.querySelector("#${objectTypeStr}_${prefix}_${pdInput.nodeId}")
${objectTypeStr}_${prefix}_${pdInput.nodeId}.oninput = (e) => {
  ${sendMsgFunctions(pdInput, prefix, false, null)}
}
`;
  }
  if (pdInput.objectType === InputType.vradio) {
    return `
const ${objectTypeStr}_${prefix}_${
      pdInput.nodeId
    } = document.querySelector("#${objectTypeStr}_${prefix}_${pdInput.nodeId}")
${objectTypeStr}_${prefix}_${pdInput.nodeId}.onchange = (e) => {
  ${sendMsgFunctions(pdInput, prefix, false, null)}
}
`;
  }
  if (pdInput.objectType === InputType.msg) {
    return `
const ${objectTypeStr}_${prefix}_${
      pdInput.nodeId
    } = document.querySelector("#${objectTypeStr}_${prefix}_${pdInput.nodeId}")
${objectTypeStr}_${prefix}_${pdInput.nodeId}.onchange = (e) => {
  ${sendMsgFunctions(pdInput, prefix, false, null)}
}
`;
  }

  throw new Error(`unknown input type: ${pdInput.objectType}`);
};

const RenderPdInputUIInitFunction = (
  pdInput: PdInput,
  prefix: string
): string => {
  if (pdInput.objectType === InputType.hsl) {
    //@ts-ignore
    const mid = (pdInput.max + pdInput.min) / 2;
    return `
const initHsl_${prefix}_${pdInput.nodeId} = () => {
  hsl_${prefix}_${pdInput.nodeId}.value = ${mid}
  setTimeout(() => {
    ${sendMsgFunctions(pdInput, prefix, true, mid)}
  }, 100)
}
`;
  }
  if (pdInput.objectType === InputType.bng) {
    return `
const initBng_${prefix}_${pdInput.nodeId} = () => {
}
`;
  }
  if (pdInput.objectType === InputType.floatatom) {
    return `
const initFloatatom_${prefix}_${pdInput.nodeId} = () => {
}
`;
  }
  if (pdInput.objectType === InputType.tgl) {
    return `
const initTgl_${prefix}_${pdInput.nodeId} = () => {
}
`;
  }
  if (pdInput.objectType === InputType.nbx) {
    return `
const initNbx_${prefix}_${pdInput.nodeId} = () => {
}
`;
  }
  if (pdInput.objectType === InputType.vsl) {
    //@ts-ignore
    const mid = (pdInput.max + pdInput.min) / 2;
    return `
const initVsl_${prefix}_${pdInput.nodeId} = () => {
  vsl_${prefix}_${pdInput.nodeId}.value = ${mid}
  setTimeout(() => {
    ${sendMsgFunctions(pdInput, prefix, true, mid)}
  }, 100)
}
`;
  }
  if (pdInput.objectType === InputType.vradio) {
    return `
const initVradio_${prefix}_${pdInput.nodeId} = () => {
}
`;
  }
  if (pdInput.objectType === InputType.msg) {
    return `
const initMsg_${prefix}_${pdInput.nodeId} = () => {
}
`;
  }

  throw new Error(`unknown input type: ${pdInput.objectType}`);
};

const RenderPdInputUIInitCall = (pdInput: PdInput, prefix: string): string => {
  if (pdInput.objectType === InputType.hsl) {
    return `
initHsl_${prefix}_${pdInput.nodeId}()
`;
  }
  if (pdInput.objectType === InputType.bng) {
    return `
initBng_${prefix}_${pdInput.nodeId}()
`;
  }
  if (pdInput.objectType === InputType.floatatom) {
    return `
initFloatatom_${prefix}_${pdInput.nodeId}()
`;
  }
  if (pdInput.objectType === InputType.tgl) {
    return `
initTgl_${prefix}_${pdInput.nodeId}()
`;
  }
  if (pdInput.objectType === InputType.nbx) {
    return `
initNbx_${prefix}_${pdInput.nodeId}()
`;
  }
  if (pdInput.objectType === InputType.vsl) {
    return `
initVsl_${prefix}_${pdInput.nodeId}()
`;
  }
  if (pdInput.objectType === InputType.vradio) {
    return `
initVradio_${prefix}_${pdInput.nodeId}()
`;
  }
  if (pdInput.objectType === InputType.msg) {
    return `
initMsg_${prefix}_${pdInput.nodeId}()
`;
  }

  throw new Error(`unknown input type: ${pdInput.objectType}`);
};

// markdown + webpd render
const customRenderer = (baseDir: string) => {
  const md = new MarkdownIt();
  const originalImgRender = md.renderer.rules.image!;
  // override image render
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx]!;
    const src = token.attrs![token.attrIndex("src")][1];
    const alt = token.content;
    if (src.endsWith(".pd")) {
      // parse pd file
      const pdInputs: Array<PdInput> = ListPdInputs(`${baseDir}/${src}`);
      const fileName = src.split("/").pop()!;
      const wasmPath = fileName.replace(".pd", ".wasm");
      const prefix = fileName.replace(".pd", "").replace(/[^a-zA-Z0-9_]/g, "_");

      return `
<style>
#${alt} {
  background-color: #eee;
  padding: 4px;
}
#onoff_${prefix} {
  margin: 4px 4px 4px 0;
}
</style>
<div id="${alt}">
  <div> ${fileName} patch demo</div>
  <button id="onoff_${prefix}"> loading... </button>
  <div id="inputs_${prefix}">
    <div>
      - volume:
      <input id="volume_${prefix}" type="range" min="0" max="1" step="0.01" value="0.5"> </input>
    </div>
    ${pdInputs.map((pdInput) => RenderPdInputHtml(pdInput, prefix)).join("\n")}
  </div>
</div>
<script>
let audioContext_${prefix} = null

// nodes
let gainNode_${prefix} = null

// elements
const onoffButton_${prefix} = document.querySelector("#onoff_${prefix}")
const volume_${prefix} = document.querySelector("#volume_${prefix}")

// idunno
let patch_${prefix} = null
let stream_${prefix} = null
let webpdNode_${prefix} = null
let isPlaying_${prefix} = false

const initApp_${prefix} = async () => {
  stream_${prefix} = await navigator.mediaDevices.getUserMedia({ audio: true })
  audioContext_${prefix} = new AudioContext()
  await WebPdRuntime.registerWebPdWorkletNode(audioContext_${prefix})
  response = await fetch("${wasmPath}")
  patch_${prefix} = await response.arrayBuffer()
  onoffButton_${prefix}.style.display = 'block'
  onoffButton_${prefix}.innerText = 'start patch'
  inputs_${prefix}.style.display = 'none'
}

const initVolume_${prefix} = () => {
  const init_vol = 0.5
  gainNode_${prefix}.gain.setValueAtTime(init_vol, audioContext_${prefix}.currentTime)
  volume_${prefix}.value = init_vol
}

${pdInputs
  .map((pdInput) => RenderPdInputUIInitFunction(pdInput, prefix))
  .join("\n")}

const startApp_${prefix} = async () => {
  if (audioContext_${prefix}.state === 'suspended') {
    audioContext_${prefix}.resume()
  }
  const sourceNode = audioContext_${prefix}.createMediaStreamSource(stream_${prefix})
  webpdNode_${prefix} = new WebPdRuntime.WebPdWorkletNode(audioContext_${prefix})
  gainNode_${prefix} = audioContext_${prefix}.createGain()
  sourceNode.connect(webpdNode_${prefix}).connect(gainNode_${prefix}).connect(audioContext_${prefix}.destination)
  webpdNode_${prefix}.port.onmessage = (message) => WebPdRuntime.fs.web(webpdNode_${prefix}, message)
  webpdNode_${prefix}.port.postMessage({
    type: 'code:WASM',
    payload: {
      wasmBuffer: patch_${prefix},
    },
  })

  initVolume_${prefix}()
  ${pdInputs
    .map((pdInput) => RenderPdInputUIInitCall(pdInput, prefix))
    .join("\n")}
  isPlaying_${prefix} = true
  onoffButton_${prefix}.innerText = 'stop patch'
  inputs_${prefix}.style.display = 'block'
}

const stopApp_${prefix} = () => {
  webpdNode_${prefix}.disconnect(gainNode_${prefix})
  gainNode_${prefix}.disconnect(audioContext_${prefix}.destination)
  audioContext_${prefix}.suspend()

  onoffButton_${prefix}.innerText = 'start patch'
  isPlaying_${prefix} = false
  inputs_${prefix}.style.display = 'none'
}

onoffButton_${prefix}.onclick = () => {
  if (isPlaying_${prefix}) {
    stopApp_${prefix}()
  } else {
    startApp_${prefix}()
  }
}

initApp_${prefix}().
  then(() => {
    console.log('_${prefix} patch wasm initialized')
})
const sendMsgToWebPd_${prefix} = (nodeId, portletId, message) => {
  webpdNode_${prefix}.port.postMessage({
    type: 'inletCaller',
    payload: {
      nodeId,
      portletId,
      message,
    },
  })
}


${pdInputs
  .map((pdInput) => RenderPdInputSendMsgFunction(pdInput, prefix))
  .join("\n")}

volume_${prefix}.oninput = (e) => {
  const gainValue = Number(e.target.value)
  gainNode_${prefix}.gain.setValueAtTime(gainValue, audioContext_${prefix}.currentTime)
}

</script>
`;
    } else {
      return originalImgRender(tokens, idx, options, env, self);
    }
  };

  // add link
  const originalRender = md.render;
  md.render = (...args) => {
    const linkElement = `<link href="https://pvinis.github.io/iosevka-webfont/3.4.1/iosevka.css" rel="stylesheet" />`;
    const html = originalRender.apply(md, args);

    return `
     <style>
       * {
          font-family: 'Iosevka', monospace;
        }
      </style>
      <script src="webpd-runtime.js"></script>
      <div>
        ${linkElement}
        ${html}
      </div>
    `;
  };

  return md;
};

// from markdown, generate html
export const RenderMd = async (
  markdownPath: string,
  cacheDir: string,
  baseDir: string
): Promise<string> => {
  await genWasmPatches(markdownPath, baseDir, cacheDir);
  const markdown = fs.readFileSync(markdownPath, "utf8");
  const md = customRenderer(baseDir);
  return md.render(markdown);
};

// from markdown, find puredata patches
const forCountPdRenderer = (compileTasks: Array<string>) => {
  const md = new MarkdownIt();
  const originalImgRender = md.renderer.rules.image!;
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx]!;
    const src = token.attrs![token.attrIndex("src")][1];
    if (src.endsWith(".pd")) {
      compileTasks.push(src);
      return `<></>`;
    } else {
      return originalImgRender(tokens, idx, options, env, self);
    }
  };

  return md;
};

// from markdown, generate wasm patches
const genWasmPatches = async (
  markdownPath: string,
  baseDir: string,
  cacheDir: string
) => {
  const compileTasks: Array<string> = [];
  const markdown = fs.readFileSync(markdownPath, "utf8");
  const md = forCountPdRenderer(compileTasks);
  md.render(markdown);

  console.log("compiling wasm patches...");
  for (const task of compileTasks) {
    const wasmPath = GenWasmPatch(baseDir + "/" + task, cacheDir).unwrap();
    console.log(`compiled ${task} to ${wasmPath}`);
  }
  console.log("compiling wasm patches done");
};
