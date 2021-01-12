import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const COVERS_PATH = path.join(__dirname, "..", "..", "data", "img");

export async function saveImage(
  url: string,
  relativePath: string,
  filename: string
): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.buffer();
  return new Promise((resolve, reject) => {
    try {
      fs.writeFile(
        path.join(COVERS_PATH, path.normalize(relativePath), filename),
        buffer,
        () => {
          console.log(
            `${filename} downloaded at:`,
            path.join(COVERS_PATH, relativePath, filename)
          );
          resolve(path.join(relativePath, filename));
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}
