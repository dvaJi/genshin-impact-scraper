import dotenv from "dotenv";

// English connectors
import CharactersENCrawler from "@connectors/en/characters";
import WeaponsENCrawler from "@connectors/en/weapons";
import ArtifactsENCrawler from "@connectors/en/artifacts";
import MaterialsENCrawler from "@connectors/en/materials";
import GemsENCrawler from "@connectors/en/gems";

// Spanish connectors
// import WeaponsESCrawler from "@connectors/es/weapons";
import CharactersESCrawler from "@connectors/es/characters";

(async () => {
  dotenv.config();

  if (process.env.CRAWL_ENGLISH === "true") {
    console.log("Starting Crawl English content...");
    const pCrawler = new CharactersENCrawler();
    await pCrawler.run();
    const wCrawler = new WeaponsENCrawler();
    await wCrawler.run();
    const aCrawler = new ArtifactsENCrawler();
    aCrawler.run();
    const mCrawler = new MaterialsENCrawler();
    mCrawler.run();
    const gCrawler = new GemsENCrawler();
    gCrawler.run();
  }

  if (process.env.CRAWL_SPANISH === "true") {
    console.log("Starting Crawl Spanish content...");

    const cCrawler = new CharactersESCrawler();
    await cCrawler.run();
    // const wCrawler = new WeaponsESCrawler();
    // await wCrawler.run();
  }

  return;
})();
