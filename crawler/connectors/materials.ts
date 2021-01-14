import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import { saveImage } from "@helper/save-img";
import { Artifact } from "@engine/Types";

export default class CharactersCrawler extends Connector {
  BASE_URL = "https://genshin-impact.fandom.com";
  selectors = {
    urls: "table > tbody > tr > td:nth-child(1) > div > div.card_caption > a",
    name: "#mw-content-text > div > aside > h2",
    imgs: "#mw-content-text > div > aside > section > table > tbody > tr > td",
    names: "table > tbody > tr:nth-child(1) > th",
    descriptions: "table > tbody > tr:nth-child(2) > td > i",
    rarity:
      "#mw-content-text > div > aside > section.pi-item.pi-panel.pi-border-color > div.pi-panel-scroll-wrapper > ul > li",
    drops:
      "#mw-content-text > div > aside > section.pi-item.pi-panel.pi-border-color > div.pi-section-contents > div",
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

    const artifactsLinks: string[] = [
      ...this.parseTableLinks(
        storedContent.get("5-Piece Artifact Sets") || "",
        this.selectors.urls
      ),
      ...this.parseTableLinks(
        storedContent.get("1-Piece Artifact Sets") || "",
        this.selectors.urls
      ),
    ];

    for await (const link of artifactsLinks) {
      // const { window } = await this.fetchDOM(
      //   new Request(this.BASE_URL + link, this.requestOptions)
      // );

      // const doc = window.document;

      // const [drops, rarity] = this.getDropAndRarity(doc);

      // const name =
      //   doc?.querySelector(this.selectors.name)?.textContent?.trim() || "";
      // const id = this.slugify(name);

      // let artifact: Artifact = {
      //   id,
      //   name:
      //     doc?.querySelector(this.selectors.name)?.textContent?.trim() || "",
      //   min_rarity: Math.min(...rarity),
      //   max_rarity: Math.max(...rarity),
      //   drop: drops,
      // };

      // const sets: any[] = [];

      // doc.querySelectorAll(this.selectors.imgs).forEach((value) => {
      //   const imgDom = value.querySelector("td > a > img");
      //   const artifactName =
      //     imgDom
      //       ?.getAttribute("alt")
      //       ?.replace(".png", "")
      //       .replace("Item ", "") || "";
      //   const type = value.getAttribute("data-source");
      //   sets.push({
      //     name: artifactName,
      //     type,
      //     img: imgDom?.getAttribute("src")?.replace("/60?", "/256?") || "",
      //   });
      // });

      // const artifactContent = this.parseWikiContent(doc);
      // // const infoboxContent = this.getInfoboxContent(doc);
      // const loreContent = artifactContent.get("Lore") || "";
      // const loreEl = this.createDOM(loreContent);

      // loreEl.window.document
      //   .querySelectorAll(this.selectors.descriptions)
      //   .forEach((value, index) => {
      //     sets[index] = {
      //       ...sets[index],
      //       description: value.textContent?.trim(),
      //     };
      //   });

      // sets.forEach(async (set) => {
      //   (artifact as any)[set.type] = {
      //     id: this.slugify(set.name),
      //     name: set.name,
      //     description: set.description,
      //   };
      //   await saveImage(set.img, "artifacts", this.slugify(set.name) + ".png");
      // });

      // this.saveFile(JSON.stringify(artifact), "/artifacts/", id);
    }
  }

}
