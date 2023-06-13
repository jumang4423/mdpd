import fs from "fs";
import MarkdownIt from "markdown-it";
import { GenWasmPatch } from "./webpd";
import { ListPdInputs, PdInput, InputType } from "./pdParser";

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
  <button id="bng_${prefix}_${pdInput.nodeId}">o</button>
</div>
`;
  } else {
    throw new Error(`unknown input type: ${pdInput.objectType}`);
  }
};

const RenderPdInputSendMsgFunction = (
  pdInput: PdInput,
  prefix: string
): string => {
  if (pdInput.objectType === InputType.hsl) {
    // TODO: inletId always 0??? huh
    return `
const hsl_${prefix}_${pdInput.nodeId} = document.querySelector("#hsl_${prefix}_${pdInput.nodeId}")
hsl_${prefix}_${pdInput.nodeId}.oninput = (e) => {
  sendMsgToWebPd_${prefix}("n_0_${pdInput.nodeId}", "0", [Number(e.target.value)])
}
`;
  }
  if (pdInput.objectType === InputType.bng) {
    return `
const bng_${prefix}_${pdInput.nodeId} = document.querySelector("#bng_${prefix}_${pdInput.nodeId}")
bng_${prefix}_${pdInput.nodeId}.onclick = (e) => {
  sendMsgToWebPd_${prefix}("n_0_${pdInput.nodeId}", "0", ["bang"])
}
`;
  } else {
    throw new Error(`unknown input type: ${pdInput.objectType}`);
  }
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
    sendMsgToWebPd_${prefix}("n_0_${pdInput.nodeId}", "0", [${mid}])
  }, 100)
}
`;
  }
  if (pdInput.objectType === InputType.bng) {
    return `
const initBng_${prefix}_${pdInput.nodeId} = () => {
}
`;
  } else {
    throw new Error(`unknown input type: ${pdInput.objectType}`);
  }
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
  } else {
    throw new Error(`unknown input type: ${pdInput.objectType}`);
  }
};

const customRenderer = (baseDir: string) => {
  const md = new MarkdownIt();
  const originalImgRender = md.renderer.rules.image!;
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
</style>
<div id="${alt}">
  <div> ${fileName} patch demo</div>
  <button id="onoff_${prefix}"> loading... </button>
  <div>
    - volume:
    <input id="volume_${prefix}" type="range" min="0" max="1" step="0.01" value="0.5"> </input>
  </div>
  ${pdInputs.map((pdInput) => RenderPdInputHtml(pdInput, prefix)).join("\n")}
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
}

const stopApp_${prefix} = () => {
  webpdNode_${prefix}.disconnect(gainNode_${prefix})
  gainNode_${prefix}.disconnect(audioContext_${prefix}.destination)
  audioContext_${prefix}.suspend()

  onoffButton_${prefix}.innerText = 'start patch'
  isPlaying_${prefix} = false
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
