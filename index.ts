import { Ok, Err, Result } from "ts-results";
import { GetMdFilePathFromArgs } from "./src/cli";
import { IsWebPDAvailable } from "./src/webpd";
import { Listen } from "./src/server";

const PORT = 3000;
let BASE_DIR: string | undefined = undefined;
const CACHE_DIR = "./cache";

const main = async () => {
  const mdFilePath = GetMdFilePathFromArgs().unwrap();
  console.log(`Detected: ${mdFilePath}`);
  BASE_DIR = mdFilePath.split("/").slice(0, -1).join("/");

  if (!(await IsWebPDAvailable())) {
    console.error("WebPD is not available");
    process.exit(1);
  }

  await Listen(mdFilePath, PORT, BASE_DIR, CACHE_DIR);
};

main();
