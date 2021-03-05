import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import { saveImage } from "@helper/save-img";
import { Material } from "@engine/Types";

export default class CharactersCrawler extends Connector {
  BASE_URL = "https://genshin-impact.fandom.com";
  selectors = {
    table_urls:
      "table > tbody > tr > td:nth-child(2) > div > div > div.card_caption > a",
    boss_drop_urls: `table > tbody > tr > td > div > div > div.card_caption > a`,
    limited_urls:
      "table > tbody > tr > td:nth-child(1) > div > div > div.card_caption > a",
    name: "#mw-content-text > div > aside > h2",
    description: "div > div",
    location: "#mw-content-text > div > aside > div:nth-child(3) > div > a",
    sources: "#mw-content-text > div > aside > section > div > div",
    rarity: "#mw-content-text > div > aside > div:nth-child(4) > div > img",
    img: "#mw-content-text > div > aside > figure > a > img",
  };

  constructor() {
    super();
    super.id = Symbol("eng_talent_materials");
    super.label = "eng_talent_materials";
  }

  protected async crawl(): Promise<void> {
    const request = new Request(
      `${this.BASE_URL}/wiki/Talent_Level-Up_Material`,
      this.requestOptions
    );
    const dom = await this.fetchDOM(request);
    const storedContent = this.parseWikiContent(dom.window.document);

    const links = [
      ...this.parseTableLinks(
        storedContent.get("Mondstadt")?.join() || "",
        this.selectors.table_urls
      ),
      ...this.parseTableLinks(
        storedContent.get("Liyue")?.join() || "",
        this.selectors.table_urls
      ),
      ...this.parseTableLinks(
        storedContent.get("Weekly Boss Drops")?.join() || "",
        this.selectors.boss_drop_urls
      ),
      ...this.parseTableLinks(
        storedContent.get("Limited-duration Event Materials")?.join() || "",
        this.selectors.limited_urls
      ),
    ];

    await this.getMaterials(links);
  }

  async getMaterials(links: string[]): Promise<void> {
    for await (const link of links) {
      const { window } = await this.fetchDOM(
        new Request(this.BASE_URL + link, this.requestOptions)
      );
      const doc = window.document;
      const infoboxContent = this.getInfoboxContent(doc);

      const name = this.getTextContent(doc, this.selectors.name);
      const id = this.slugify(name);
      const description = this.getTextContent(
        infoboxContent.get("description") || "",
        this.selectors.description
      );

      const itemType = this.getTextContent(doc, this.selectors.location);

      const sources: string[] = [];
      doc.querySelectorAll(this.selectors.sources).forEach((value) => {
        sources.push(value.textContent?.trim() || "");
      });

      const imgSrc =
        doc
          .querySelector(this.selectors.img)
          ?.getAttribute("src")
          ?.replace("/60?", "/256?") || "";
      const rarity = Number(
        doc
          ?.querySelector(this.selectors.rarity)
          ?.getAttribute("alt")
          ?.trim()
          .replace(/( Stars| Star)/, "")
      );

      const material: Material = {
        id,
        name,
        description,
        material_type: ["Talent Level-Up Material"],
        type: "Talent Level-Up Material",
        location: itemType.split(" ")[0],
        sources,
        rarity,
      };

      await saveImage(imgSrc, "materials", id + ".png");
      this.saveFile(material, "/materials/", id);
    }
  }
}
