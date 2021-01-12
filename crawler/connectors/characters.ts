// import { Browser } from "puppeteer";
// import { Page } from "puppeteer";
// import { Connector } from "@engine/Connector";
// import { Character } from "@engine/Types";

// export default class CharactersCrawler extends Connector {
//   BASE_URL = "https://genshin-impact.fandom.com";
//   selectors = {
//     urls:
//       "#gallery-0 > div > div.thumb > div > a, #gallery-1 > div > div.thumb > div > a, #gallery-2 > div > div.thumb > div > a",
//     name: "#mw-content-text > div > aside > h2",
//     rarity:
//       "#mw-content-text > div > aside > section.pi-item.pi-group.pi-border-color > table > tbody > tr > td:nth-child(1) > img",
//     type:
//       "#mw-content-text > div > aside > section.pi-item.pi-group.pi-border-color > table > tbody > tr > td:nth-child(3) > span",
//     weapon:
//       "#mw-content-text > div > aside > section.pi-item.pi-group.pi-border-color > table > tbody > tr > td:nth-child(2) > span",
//     region:
//       "#mw-content-text > div > aside > section.pi-item.pi-panel.pi-border-color > div.pi-section-contents > div.pi-section-content.pi-section-active > div:nth-child(4) > div > a",
//     description:
//       "#mw-content-text > div > blockquote:nth-child(13) > p.pull-quote__text",
//   };

//   protected async crawl(_: Browser, page: Page) {
//     let characters: Character[] = [];
//     await page.goto("https://genshin-impact.fandom.com/wiki/Characters");

//     const charactersLinks = await page.evaluate((resultsSelector) => {
//       const anchors: HTMLTableRowElement[] = Array.from(
//         document.querySelectorAll(resultsSelector)
//       );
//       return anchors
//         .filter(
//           (anchor) =>
//             anchor.hasAttribute("href") &&
//             anchor.getAttribute("href") !== "/wiki/Traveler"
//         )
//         .map((anchor) => {
//           return anchor.getAttribute("href") || "";
//         });
//     }, this.selectors.urls);

//     console.log("charactersLinks", charactersLinks);
//     let id = 1;
//     for await (const link of charactersLinks) {
//       console.log(link);
//       await page.goto(this.BASE_URL + link);

//       let character: any = {};

//       character = await page.evaluate((resultsSelector) => {
//         let character: any = {};
//         character.name = document
//           .querySelector(resultsSelector.name)
//           .textContent.trim();
//         character.rarity = Number(
//           document
//             .querySelector(resultsSelector.rarity)
//             .getAttribute("alt")
//             .trim()
//             .replace(" Stars", "")
//         );
//         character.type = document
//           .querySelector(resultsSelector.type)
//           .textContent.trim();
//         character.weapon = document
//           .querySelector(resultsSelector.weapon)
//           .textContent.trim();
//         character.region = document
//           .querySelector(resultsSelector.region)
//           .textContent.trim();
//         // character.description = document
//         //   .querySelector(resultsSelector.description)
//         //   .textContent.trim();

//         return character;
//       }, this.selectors);

//       characters.push({ ...character, id: id++ });
//       // break;
//     }

//     console.log(characters);
//     this.saveFile(JSON.stringify(characters), "characters");
//   }
// }
