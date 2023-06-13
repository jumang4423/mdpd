import express from "express";
import { RenderMd } from "./mdRenderer";
import fs from "fs";

export const Listen = async (
  htmlFilePath: string,
  port: number,
  baseDir: string,
  cacheDir: string
) => {
  const app = express();
  let html: string = await RenderMd(htmlFilePath, cacheDir, baseDir);

  app.use(express.static(cacheDir));
  app.use(express.static(baseDir));
  app.use(express.static("./public"));

  fs.watch(htmlFilePath, async () => {
    console.log("File changed, rerendering");
    html = await RenderMd(htmlFilePath, cacheDir, baseDir);
  });

  app.get("/", async (_, res) => {
    res.send(html);
  });

  app.listen(port, () => {
    console.log(`💫 Server listening on port ${port}...`);
  });
};
