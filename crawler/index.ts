import dotenv from "dotenv";
// import CharactersCrawler from "@connectors/characters";
// import WeaponsCrawler from "@connectors/weapons";
// import ArtifactsCrawler from "@connectors/artifacts";
import MaterialsCrawler from "@connectors/materials";
// import GemsCrawler from "@connectors/gems";

(async () => {
  dotenv.config();
  // const crawler = new CharactersCrawler();
  // await crawler.run();
  // const wCrawler = new WeaponsCrawler();
  // await wCrawler.run();
  // const aCrawler = new ArtifactsCrawler();
  // aCrawler.run();
  const mCrawler = new MaterialsCrawler();
  mCrawler.run();
  // const gCrawler = new GemsCrawler();
  // gCrawler.run();
  return;
})();
