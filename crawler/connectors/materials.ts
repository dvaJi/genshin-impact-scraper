import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import { saveImage } from "@helper/save-img";
import { Material } from "@engine/Types";

export default class CharactersCrawler extends Connector {
  BASE_URL = "https://genshin-impact.fandom.com";
  specialities_selectors = {
    urls: "table > tbody > tr > td:nth-child(1) > span > a",
    name: "#mw-content-text > div > aside > h2",
    description: "#mw-content-text > div > aside > div:nth-child(4) > div",
    location: "#mw-content-text > div > aside > div:nth-child(3) > div > a",
    sources: "#mw-content-text > div > aside > section > div > div",
    img:
      "#pi-tab-0 > figure > a > img, #mw-content-text > div > aside > figure > a > img",
  };
  boss_selectors = {
    urls: "table > tbody > tr > td:nth-child(2) > span > a",
    name: "#mw-content-text > div > aside > h2",
    description: "#mw-content-text > div > aside > div:nth-child(5) > div",
    rarity: "#mw-content-text > div > aside > div:nth-child(4) > div > img",
    img: "#mw-content-text > div > aside > figure > a > img",
  };

  constructor() {
    super();
    super.id = Symbol("eng_materials");
    super.label = "eng_materials";
  }

  protected async crawl() {
    const request = new Request(
      `${this.BASE_URL}/wiki/Character_Ascension_Materials`,
      this.requestOptions
    );
    const dom = await this.fetchDOM(request);
    const storedContent = this.parseWikiContent(dom.window.document);

    const bossLinks = this.parseTableLinks(
      storedContent.get("Elite Boss Materials")?.join() || "",
      this.boss_selectors.urls
    );

    await this.getBossMaterial(bossLinks);

    const specialitiesLinks = this.parseTableLinks(
      storedContent.get("Local Specialities")?.join() || "",
      this.specialities_selectors.urls
    );

    await this.getLocalSpecialtiesMaterial(specialitiesLinks);
  }

  async getBossMaterial(links: string[]) {
    for await (const link of links) {
      const { window } = await this.fetchDOM(
        new Request(this.BASE_URL + link, this.requestOptions)
      );
      const doc = window.document;

      const name = this.getTextContent(doc, this.boss_selectors.name);
      const id = this.slugify(name);
      const description = this.getTextContent(
        doc,
        this.boss_selectors.description
      );
      const rarity = Number(
        doc
          .querySelector(this.boss_selectors.rarity)
          ?.getAttribute("alt")
          ?.trim()
          .replace(/( Stars| Star)/, "") || ""
      );

      const imgSrc =
        doc
          .querySelector(this.boss_selectors.img)
          ?.getAttribute("src")
          ?.replace("/60?", "/256?") || "";

      const material: Material = {
        id,
        name,
        description,
        material_type: ["Character Ascension"],
        rarity,
        type: "Elite Boss Material",
      };

      await saveImage(imgSrc, "materials", id + ".png");
      this.saveFile(JSON.stringify(material), "/materials/", id);
    }
  }

  async getLocalSpecialtiesMaterial(links: string[]) {
    for await (const link of links) {
      const { window } = await this.fetchDOM(
        new Request(this.BASE_URL + link, this.requestOptions)
      );
      const doc = window.document;

      const name = this.getTextContent(doc, this.specialities_selectors.name);
      const id = this.slugify(name);
      const description = this.getTextContent(
        doc,
        this.specialities_selectors.description
      );

      const itemType = this.getTextContent(
        doc,
        this.specialities_selectors.location
      );

      const sources: string[] = [];
      doc
        .querySelectorAll(this.specialities_selectors.sources)
        .forEach((value) => {
          sources.push(value.textContent?.trim() || "");
        });

      const imgSrc =
        doc
          .querySelector(this.specialities_selectors.img)
          ?.getAttribute("src")
          ?.replace("/60?", "/256?") || "";

      const material: Material = {
        id,
        name,
        description,
        material_type: ["Character Ascension", "Craft"],
        type: "Local Specialities Material",
        location: itemType.split(" ")[0],
        sources,
      };

      await saveImage(imgSrc, "materials", id + ".png");
      this.saveFile(JSON.stringify(material), "/materials/", id);
    }
  }
}
