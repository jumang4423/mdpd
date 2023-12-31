import { GetMdFilePathFromArgs } from "./src/cli";
import { IsWebPDAvailable } from "./src/webpd";
import { Listen } from "./src/server";

const PORT = 3000;
const CACHE_DIR = "./cache";
let BASE_DIR: string | undefined = undefined;
const main = async () => {
  // load md file path from args
  const mdFilePath = GetMdFilePathFromArgs().unwrap();
  console.log(`Detected: ${mdFilePath}`);
  BASE_DIR = mdFilePath.split("/").slice(0, -1).join("/");
  console.log(`Base directory: ${BASE_DIR}`);
  // check if webpd is available on the system
  if (!(await IsWebPDAvailable())) {
    console.error("WebPD is not available");
    process.exit(1);
  }
  await Listen(mdFilePath, PORT, BASE_DIR, CACHE_DIR);
};

main();
