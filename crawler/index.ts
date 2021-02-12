/* eslint-disable */
import dotenv from "dotenv";

// English connectors
import CharactersENCrawler from "@connectors/en/characters";
import WeaponsENCrawler from "@connectors/en/weapons";
import ArtifactsENCrawler from "@connectors/en/artifacts";
import MaterialsENCrawler from "@connectors/en/character-ascension-materials";
import TalentMaterialsENCrawler from "@connectors/en/talent-materials";
import CommonMaterialsENCrawler from "@connectors/en/common-materials";

// Spanish connectors
import WeaponsESCrawler from "@connectors/es/weapons";
import CharactersESCrawler from "@connectors/es/characters";
import ArtifactsESCrawler from "@connectors/es/artifacts";
import AscensionMaterialsESCrawler from "@connectors/es/ascension-materials";
import TalentMaterialsESCrawler from "@connectors/es/talent-materials";

// Spanish connectors
import WeaponsJPCrawler from "@connectors/jp/weapons";
import CharactersJPCrawler from "@connectors/jp/characters";
// import ArtifactsJPCrawler from "@connectors/jp/artifacts";
import MaterialsJPCrawler from "@connectors/jp/materials";
// import TalentMaterialsJPCrawler from "@connectors/jp/talent-materials";

(async () => {
  dotenv.config();

  if (process.env.CRAWL_ENGLISH === "true") {
    console.log("Starting Crawl English content...");
    // const pCrawler = new CharactersENCrawler();
    // await pCrawler.run();
    const wCrawler = new WeaponsENCrawler();
    await wCrawler.run();
    const aCrawler = new ArtifactsENCrawler();
    aCrawler.run();
    const mCrawler = new MaterialsENCrawler();
    mCrawler.run();
    const tmCrawler = new TalentMaterialsENCrawler();
    tmCrawler.run();
    const cmCrawler = new CommonMaterialsENCrawler();
    cmCrawler.run();
  }

  if (process.env.CRAWL_SPANISH === "true") {
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
  }

  if (process.env.CRAWL_JAPANESE === "true") {
    console.log("Starting Crawl Japanese content...");

    // const cCrawler = new CharactersJPCrawler();
    // await cCrawler.run();
    // const wCrawler = new WeaponsJPCrawler();
    // await wCrawler.run();
    // const aCrawler = new ArtifactsJPCrawler();
    // await aCrawler.run();
    const amCrawler = new MaterialsJPCrawler();
    await amCrawler.run();
    // const tmCrawler = new TalentMaterialsJPCrawler();
    // await tmCrawler.run();
  }

  // End
  process.exit(1);
})();
