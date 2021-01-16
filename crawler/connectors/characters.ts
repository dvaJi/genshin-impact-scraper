import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import { Character } from "@engine/Types";
import { saveImage } from "@helper/save-img";

export default class CharactersCrawler extends Connector {
  BASE_URL = "https://genshin-impact.fandom.com";
  selectors = {
    urls: "table > tbody > tr > td:nth-child(2) > a",
    name: "#mw-content-text > div > aside > h2",
    rarity:
      "#mw-content-text > div > aside > section.pi-item.pi-group.pi-border-color > table > tbody > tr > td:nth-child(1) > img",
    element:
      "#mw-content-text > div > aside > section.pi-item.pi-group.pi-border-color > table > tbody > tr > td:nth-child(3) > span",
    weapon:
      "#mw-content-text > div > aside > section.pi-item.pi-group.pi-border-color > table > tbody > tr > td:nth-child(2) > span",
    titles:
      "#mw-content-text > div > aside > section.pi-item.pi-panel.pi-border-color > div.pi-section-contents > div.pi-section-content.pi-section-active > section > section > section > div",
    description: "blockquote > p.pull-quote__text",
    img: "#pi-tab-0 > figure > a > img",
  };

  constructor() {
    super();
    super.id = Symbol("eng_weapons");
    super.label = "eng_weapons";
  }

  protected async crawl() {
    const request = new Request(
      `${this.BASE_URL}/wiki/Characters`,
      this.requestOptions
    );
    const dom = await this.fetchDOM(request);
    const storedContent = this.parseWikiContent(dom.window.document);

    const charactersLinks = this.parseTableLinks(
      storedContent.get("Playable Characters")?.join() || "",
      this.selectors.urls
    );

    for await (const link of charactersLinks) {
      const { window } = await this.fetchDOM(
        new Request(this.BASE_URL + link, this.requestOptions)
      );

      const doc = window.document;
      const characterContent = this.parseWikiContent(doc);
      const infoboxContent = this.getInfoboxContent(doc);

      const name = this.getTextContent(doc, this.selectors.name);
      const id = this.slugify(name);
      const description = this.getTextContent(
        characterContent.get("Personality")?.join() || "",
        this.selectors.description
      );
      const weapon_type = this.getTextContent(doc, this.selectors.weapon);
      const rarity = Number(
        doc
          .querySelector(this.selectors.rarity)
          ?.getAttribute("alt")
          ?.trim()
          .replace(/( Stars| Star)/, "")
      );
      const element = this.getTextContent(doc, this.selectors.element);
      const titles = this.getTextContentArray(doc, this.selectors.titles);

      const skills = [];
      const passives = [];
      const constellations = [];
      const ascension = [];

      const character: Character = {
        id,
        name,
        description,
        weapon_type,
        element,
        gender: infoboxContent.get("Sex") || "",
        region: infoboxContent.get("Nation") || "",
        rarity,
        location: infoboxContent.get("How to Obtain")?.includes("Wish")
          ? "Wish"
          : "Quest",
        titles,
      };

      console.log(character);
      const img =
        doc?.querySelector(this.selectors.img)?.getAttribute("src") || "";
      await saveImage(img, "characters", id + "_card.png");
      this.saveFile(JSON.stringify(character), "/characters/", id);
      break;
    }
  }
}
