import { Ok, Err, Result } from "ts-results";
import util from "util";
import { exec } from "child_process";

export const IsWebPDAvailable = async () => {
  try {
    await util.promisify(exec)("webpd --version");
    return true;
  } catch (e) {
    return false;
  }
};
export const GenWasmPatch = (
  pdFilePath: string,
  cacheDir: string
): Result<string, Error> => {
  try {
    const filename = pdFilePath.split("/").pop()!;
    const wasmPath = `${cacheDir}/${filename.replace(".pd", ".wasm")}`;
    console.log(`Generating wasm file: ${wasmPath}`);
    util.promisify(exec)(`webpd -i ${pdFilePath} -o ${wasmPath} -f wasm`);
    return Ok(wasmPath);
  } catch (e) {
    return Err(new Error(String(e)));
  }
};
