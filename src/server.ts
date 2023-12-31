import express from "express";
import { RenderMd, getMarkdownFiles } from "./mdRenderer";
import fs from "fs";

export const Listen = async (
  mainMdPath: string,
  port: number,
  baseDir: string,
  cacheDir: string
) => {
  const app = express();
  let html: string = await RenderMd(mainMdPath, cacheDir, baseDir);
  let mdFiles = getMarkdownFiles(baseDir, baseDir);
  app.use(express.static(cacheDir));
  app.use(express.static(baseDir));
  app.use(express.static("./public"));
  // watch all md files in the base directory
  for (const mdFile of mdFiles) {
    const mdFilePath = `${baseDir}/${mdFile}`;
    fs.watch(mdFilePath, async () =>{
      console.log("=== File changed, reloading...");
      html = await RenderMd(mdFilePath, cacheDir, baseDir);
    });
  }
  app.get("/", async (_, res) => {
    res.send(html);
  });
  app.listen(port, () => {
    console.log(`💫 Server listening on port ${port}...`);
  });
};
