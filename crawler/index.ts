/* eslint-disable */
import dotenv from "dotenv";

// English connectors
import CharactersENCrawler from "@connectors/en/characters";
import WeaponsENCrawler from "@connectors/en/weapons";
import ArtifactsENCrawler from "@connectors/en/artifacts";
import MaterialsENCrawler from "@connectors/en/character-ascension-materials";
import TalentMaterialsENCrawler from "@connectors/en/talent-materials";
import CommonMaterialsENCrawler from "@connectors/en/common-materials";
import WeaponAscMaterialsENCrawler from "@connectors/en/weapon-ascension-materials";
import CookingIngredientsENCrawler from "@connectors/en/cooking-ingredients";
import FoodENCrawler from "@connectors/en/food";
import PotionsENCrawler from "@connectors/en/potions";

// Spanish connectors
import WeaponsESCrawler from "@connectors/es/weapons";
import CharactersESCrawler from "@connectors/es/characters";
import ArtifactsESCrawler from "@connectors/es/artifacts";
import AscensionMaterialsESCrawler from "@connectors/es/ascension-materials";
import TalentMaterialsESCrawler from "@connectors/es/talent-materials";
import CookingIngredientsESCrawler from "@connectors/es/cooking-ingredients";
import FoodESCrawler from "@connectors/es/food";

// Spanish connectors
import WeaponsJPCrawler from "@connectors/jp/weapons";
import CharactersJPCrawler from "@connectors/jp/characters";
// import ArtifactsJPCrawler from "@connectors/jp/artifacts";
import MaterialsJPCrawler from "@connectors/jp/materials";

import { clearFolder } from "@helper/clear-content";
import { createMaterialsIndex } from "@helper/create-es-materials-index";

(async () => {
  dotenv.config();

  if (process.env.CRAWL_ENGLISH === "true") {
    // await clearFolder("/en/artifacts/");
    // await clearFolder("/en/talent_lvl_up_materials/");
    // await clearFolder("/en/local_materials/");
    // await clearFolder("/en/elemental_stone_materials/");
    // await clearFolder("/en/jewels_materials/");
    // await clearFolder("/en/common_materials/");
    // await clearFolder("/en/weapon_secondary_materials/");
    // await clearFolder("/en/weapon_primary_materials/");
    // await clearFolder("/en/characters/");
    // await clearFolder("/en/weapons/");
    // await clearFolder("/en/ingredients/");
    // await clearFolder("/en/food/");
    await clearFolder("/en/potions/");
    console.log("Starting Crawl English content...");
    // const pCrawler = new CharactersENCrawler();
    // await pCrawler.run();
    // const wCrawler = new WeaponsENCrawler();
    // await wCrawler.run();
    // const aCrawler = new ArtifactsENCrawler();
    // await aCrawler.run();
    // const mCrawler = new MaterialsENCrawler();
    // await mCrawler.run();
    // const tmCrawler = new TalentMaterialsENCrawler();
    // await tmCrawler.run();
    // const cmCrawler = new CommonMaterialsENCrawler();
    // await cmCrawler.run();
    // const waCrawler = new WeaponAscMaterialsENCrawler();
    // await waCrawler.run();
    // const ciCrawler = new CookingIngredientsENCrawler();
    // await ciCrawler.run();
    // const fCrawler = new FoodENCrawler();
    // await fCrawler.run();
    const potionsCrawler = new PotionsENCrawler();
    await potionsCrawler.run();
  }

  createMaterialsIndex();

  if (process.env.CRAWL_SPANISH === "true") {
    await clearFolder("/es/characters/");
    await clearFolder("/es/weapons/");
    await clearFolder("/es/artifacts/");
    await clearFolder("/es/materials/");
    await clearFolder("/es/talent_lvl_up_materials/");
    await clearFolder("/es/local_materials/");
    await clearFolder("/es/elemental_stone_materials/");
    await clearFolder("/es/jewels_materials/");
    await clearFolder("/es/common_materials/");
    await clearFolder("/es/weapon_secondary_materials/");
    await clearFolder("/es/weapon_primary_materials/");
    await clearFolder("/es/ingredients/");
    await clearFolder("/es/food/");
    await clearFolder("/es/potions/");

    console.log("Starting Crawl Spanish content...");

    const cCrawler = new CharactersESCrawler();
    await cCrawler.run();
    const wCrawler = new WeaponsESCrawler();
    await wCrawler.run();
    const aCrawler = new ArtifactsESCrawler();
    await aCrawler.run();
    const amCrawler = new AscensionMaterialsESCrawler();
    await amCrawler.run();
    const tmCrawler = new TalentMaterialsESCrawler();
    await tmCrawler.run();
    const ciCrawler = new CookingIngredientsESCrawler();
    await ciCrawler.run();
    const foodCrawler = new FoodESCrawler();
    await foodCrawler.run();
  }

  if (process.env.CRAWL_JAPANESE === "true") {
    await clearFolder("/jp/artifacts/");
    await clearFolder("/jp/characters/");
    await clearFolder("/jp/weapons/");
    await clearFolder("/jp/artifacts/");
    await clearFolder("/jp/materials/");
    await clearFolder("/jp/talent_lvl_up_materials/");
    await clearFolder("/jp/local_materials/");
    await clearFolder("/jp/elemental_stone_materials/");
    await clearFolder("/jp/jewels_materials/");
    await clearFolder("/jp/common_materials/");
    await clearFolder("/jp/weapon_secondary_materials/");
    await clearFolder("/jp/weapon_primary_materials/");
    await clearFolder("/jp/ingredients/");
    await clearFolder("/jp/food/");
    await clearFolder("/jp/potions/");
    console.log("Starting Crawl Japanese content...");

    const cCrawler = new CharactersJPCrawler();
    await cCrawler.run();
    const wCrawler = new WeaponsJPCrawler();
    await wCrawler.run();
    // const aCrawler = new ArtifactsJPCrawler();
    // await aCrawler.run();
    const amCrawler = new MaterialsJPCrawler();
    await amCrawler.run();
  }

  // End
  process.exit(1);
})();
