import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import { saveImage } from "@helper/save-img";

export default class CharactersCrawler extends Connector {
  BASE_URL = "https://genshin-impact.fandom.com";
  selectors = {
    gems_urls: "table > tbody > tr > td:nth-child(1) > a",
    boss_urls: "table > tbody > tr > td:nth-child(2) > span > a",
    specialities_urls: "table > tbody > tr > td:nth-child(1) > span > a",
    name: "#mw-content-text > div > aside > h2",
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

    const gemsLinks = this.parseTableLinks(
      storedContent.get("Ascension Gems") || "",
      this.selectors.gems_urls
    );

    for await (const link of gemsLinks) {
      const { window } = await this.fetchDOM(
        new Request(this.BASE_URL + link, this.requestOptions)
      );
      const doc = window.document;
      const gemContent = this.parseWikiContent(doc);
      const qualityContent = gemContent.get("Quality");
      const name =
        doc?.querySelector(this.selectors.name)?.textContent?.trim() || "";
      const id = this.slugify(name);
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

    
    const bossLinks = this.parseTableLinks(
      storedContent.get("Elite Boss Materials") || "",
      this.selectors.boss_urls
    );

    const specialitiesLinks = this.parseTableLinks(
      storedContent.get("Local Specialities") || "",
      this.selectors.specialities_urls
    );
  }
}
