import fs from "fs-extra";
import path from "path";

const DATA_PATH = path.join(__dirname, "..", "..", "data");

export const clearFolder = async (directory: string): Promise<void> => {
  const dirPath = path.join(DATA_PATH, directory);
  try {
    await fs.remove(dirPath);
    await fs.ensureDir(dirPath);
    console.log(`Content of [${directory}] deleted successfully`);
  } catch (err) {
    console.error(err);
  }
};
