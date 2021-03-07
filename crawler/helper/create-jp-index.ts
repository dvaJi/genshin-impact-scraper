/* eslint-disable */
import fs from "fs-extra";
import path from "path";

const EN_DATA_PATH = path.join(__dirname);
const JP_DATA_PATH = path.join(__dirname, "..", "..", "data", "jp");

const materialsIndexMap = require(path.join(
  EN_DATA_PATH,
  `materials_index.json`
));

const materialsNamesMap = require(path.join(
  JP_DATA_PATH,
  `materials_names_map.json`
));

const charactersNamesMap = require(path.join(
  JP_DATA_PATH,
  `characters_names_map.json`
));

const weaponsNamesMap = require(path.join(
  JP_DATA_PATH,
  `weapons_names_map.json`
));

const artifactsNamesMap = require(path.join(
  JP_DATA_PATH,
  `artifacts_names_map.json`
));

type Folders = "characters" | "weapons" | "artifacts" | "materials";

export const finalId = (id: string, folder: Folders): string => {
  switch (folder) {
    case "characters":
      return charactersNamesMap[id] ? charactersNamesMap[id] : id;
    case "weapons":
      return weaponsNamesMap[id] ? weaponsNamesMap[id] : id;
    case "artifacts":
      return artifactsNamesMap[id] ? artifactsNamesMap[id] : id;
    case "materials":
      return materialsNamesMap[id] ? materialsNamesMap[id] : id;
    default:
      return id;
  }
};

export const findMaterialFolder = (id: string): string => {
  if (!id) return "materials";

  return materialsIndexMap[id] ? materialsIndexMap[id] : "materials";
};
