/* eslint-disable */
import fs from "fs-extra";
import path from "path";

const EN_DATA_PATH = path.join(__dirname);
const ES_DATA_PATH = path.join(__dirname, "..", "..", "data", "es");
const folders = [
  "common_materials",
  "elemental_stone_materials",
  "jewels_materials",
  "local_materials",
  "talent_lvl_up_materials",
  "weapon_primary_materials",
  "weapon_secondary_materials",
];

const namesMap = require(path.join(ES_DATA_PATH, `materials_names_map.json`));

export const createMaterialsIndex = async (): Promise<void> => {
  const index: any = {};
  try {
    for (const folder of folders) {
      const folderPath = path.join(EN_DATA_PATH, folder);
      fs.readdirSync(folderPath).forEach((filename: string) => {
        index[filename.replace(".json", "")] = folder;
      });
    }

    console.log(index);

    fs.writeFileSync(
      path.join(ES_DATA_PATH, `materials_index.json`),
      JSON.stringify(index, null, "\t")
    );
  } catch (err) {
    console.error(err);
  }
};

export const finalId = (id: string): string => {
  return namesMap[id] ? namesMap[id] : id;
};

export const findMaterialFolder = (id: string): string => {
  if (!id) return "materials";

  const index = require(path.join(ES_DATA_PATH, `materials_index.json`));

  return index[id] ? index[id] : "materials";
};
