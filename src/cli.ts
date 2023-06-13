import process from "process";
import { Ok, Err, Result } from "ts-results";

export const GetMdFilePathFromArgs = (): Result<string, Error> => {
  const filename = process.argv[2];
  if (!filename) {
    return Err(new Error("No filename provided"));
  }
  if (!filename.endsWith(".md")) {
    return Err(new Error("Filename must end with .md"));
  }

  return Ok(filename);
};
