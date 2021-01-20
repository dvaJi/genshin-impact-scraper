import fs from "fs-extra";
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

  const filePath = path.join(
    COVERS_PATH,
    path.normalize(relativePath),
    filename
  );
  await fs.ensureDir(path.dirname(filePath));
  await fs.outputFile(filePath, buffer);

  console.log(`${filename} downloaded at:`, filePath);
  return path.join(relativePath, filename);
}
