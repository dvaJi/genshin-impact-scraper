import dotenv from "dotenv";
// import CharactersCrawler from "@connectors/characters";
import WeaponsCrawler from "@connectors/weapons";

(async () => {
  dotenv.config();
  // const crawler = new CharactersCrawler();
  // await crawler.run();
  const wCrawler = new WeaponsCrawler();
  await wCrawler.run();
  return;
})();
