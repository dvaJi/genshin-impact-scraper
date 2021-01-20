import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import { Weapon } from "@engine/Types";
import { saveImage } from "@helper/save-img";

export default class CharactersCrawler extends Connector {
  BASE_URL = "https://genshin-impact.fandom.com";
  weapons = ["Swords", "Claymores", "Polearms", "Catalysts", "Bows"];
  selectors = {
    urls: "table > tbody > tr > td:nth-child(1) > a",
    name: "#mw-content-text > div > aside > h2",
    img: "#mw-content-text > div > aside > figure > a > img",
    rarity: "#mw-content-text > div > aside > div:nth-child(4) > div > img",
    type: "#mw-content-text > div > aside > div:nth-child(3) > div > a",
    description: "#mw-content-text > div > p:nth-child(6) > i",
    base_atk:
      "#mw-content-text > div > aside > section.pi-item.pi-group.pi-border-color > table > tbody > tr > td:nth-child(1)",
    substat:
      "#mw-content-text > div > aside > section.pi-item.pi-group.pi-border-color > table > tbody > tr > td:nth-child(2)",
    substat_value:
      "#mw-content-text > div > aside > section.pi-item.pi-group.pi-border-color > table > tbody > tr > td:nth-child(3)",
    passive: "#mw-content-text > div > aside > div:nth-child(10) > div",
    bonus:
      "#mw-content-text > div > aside > section:nth-child(11) > div.pi-section-contents > div.pi-section-content.pi-section-active > div:nth-child(1) > div",
    location: "#mw-content-text > div > aside > div:nth-child(6) > div > a",
    series: "#mw-content-text > div > aside > div:nth-child(5) > div",
  };

  constructor() {
    super();
    super.id = Symbol("eng_weapons");
    super.label = "eng_weapons";
  }

  protected async crawl() {
    let weaponsLinks: string[] = [];

    for await (const weaponName of this.weapons) {
      const request = new Request(
        `${this.BASE_URL}/wiki/${weaponName}`,
        this.requestOptions
      );
      const dom = await this.fetchDOM(request);
      const storedContent = this.parseWikiContent(dom.window.document);

      weaponsLinks = [
        ...weaponsLinks,
        ...this.parseTableLinks(
          storedContent.get(`List of ${weaponName}`)?.join() || "",
          this.selectors.urls
        ),
      ];
    }

    // console.log("weaponsLinks", weaponsLinks);
    for await (const link of weaponsLinks) {
      const { window } = await this.fetchDOM(
        new Request(this.BASE_URL + link, this.requestOptions)
      );

      const doc = window.document;

      // const weaponContent = this.parseWikiContent(doc);
      // const infoboxContent = this.getInfoboxContent(doc);

      const name = this.getTextContent(doc, this.selectors.name);
      const id = this.slugify(name);
      const img =
        doc?.querySelector(this.selectors.img)?.getAttribute("src") || "";
      await saveImage(img, "weapons", id + ".png");

      const weapon: Weapon = {
        id,
        name,
        description: this.getTextContent(doc, this.selectors.description),
        location: this.getTextContent(doc, this.selectors.location),
        type: this.getTextContent(doc, this.selectors.type),
        rarity: Number(
          doc
            ?.querySelector(this.selectors.rarity)
            ?.getAttribute("alt")
            ?.trim()
            .replace(/( Stars| Star)/, "")
        ),
        base: Number(this.getTextContent(doc, this.selectors.base_atk)),
        passive: this.getTextContent(doc, this.selectors.passive),
        bonus: this.getTextContent(doc, this.selectors.bonus),
        secondary: this.getTextContent(doc, this.selectors.substat),
        series: this.getTextContent(doc, this.selectors.series),
      };

      // weapons.push({ ...weapon, id: id++ });
      this.saveFile(JSON.stringify(weapon), "/weapons/", id);
    }

    // console.log(weapons);
    // this.saveFile(JSON.stringify(weapons), "weapons");
  }
}
