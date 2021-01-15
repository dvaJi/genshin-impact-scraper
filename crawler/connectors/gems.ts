import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import { saveImage } from "@helper/save-img";
import { GemsMaterial } from "@engine/Types";
import { tableJson } from "@helper/table-json";

export default class CharactersCrawler extends Connector {
  BASE_URL = "https://genshin-impact.fandom.com";
  selectors = {
    gems_urls: "table > tbody > tr > td:nth-child(1) > a",
    quality_urls: "table > tbody > tr > td:nth-child(3) > a",
    name: "#mw-content-text > div > aside > h2",
    description: "#mw-content-text > div > aside > div:nth-child(5) > div",
    img: "#mw-content-text > div > aside > figure > a > img",
    quality: "#mw-content-text > div > aside > div:nth-child(4) > div > img",
    sources: "#mw-content-text > div > aside > section > div > div",
  };

  constructor() {
    super();
    super.id = Symbol("eng_gems_materials");
    super.label = "eng_gems_materials";
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

      const name =
        doc?.querySelector(this.selectors.name)?.textContent?.trim() || "";
      const id = this.slugify(name);
      let gem: GemsMaterial = {
        id,
        name:
          doc?.querySelector(this.selectors.name)?.textContent?.trim() || "",
        material_type: ["Character Ascension"],
        quality: [],
      };

      const qualityLinks = this.parseTableLinks(
        gemContent.get("Quality") || "",
        this.selectors.quality_urls
      );

      let lastCraft: { name: string; amount: number } | undefined = undefined;

      for await (const qlink of qualityLinks) {
        const qdom = await this.fetchDOM(
          new Request(this.BASE_URL + qlink, this.requestOptions)
        );
        const qdoc = qdom.window.document;
        const qContent = this.parseWikiContent(qdoc);
        const sources: string[] = [];
        qdoc.querySelectorAll(this.selectors.sources).forEach((value) => {
          sources.push(value?.textContent?.trim() || "");
        });

        const imgSrc =
          qdoc
            .querySelector(this.selectors.img)
            ?.getAttribute("src")
            ?.replace("/60?", "/256?") ||
          "" ||
          "";

        const name =
          qdoc.querySelector(this.selectors.name)?.textContent?.trim() || "";
        const id = this.slugify(name);

        gem.quality.push({
          id,
          name,
          description:
            qdoc
              .querySelector(this.selectors.description)
              ?.textContent?.trim() || "",
          rarity: Number(
            qdoc
              .querySelector(this.selectors.quality)
              ?.getAttribute("alt")
              ?.trim()
              .replace(/( Stars| Star)/, "") || ""
          ),
          sources,
          craft: lastCraft ? { ...lastCraft } : undefined,
        });

        lastCraft = this.parseCraftTable(qContent.get("Craft Usage"));
        if (lastCraft) {
          lastCraft.name = name;
        }

        await saveImage(imgSrc, "materials", id + ".png");
      }

      this.saveFile(JSON.stringify(gem), "/materials/", id);
    }
  }

  parseCraftTable(
    content: string = ""
  ): { name: string; amount: number } | undefined {
    try {
      const craftTable = tableJson(content);
      const nameIndex = craftTable.columns.indexOf("Name");
      const amountIndex = craftTable.columns.indexOf("Amount");

      const name = craftTable.data[0][nameIndex];
      const amount = Number(craftTable.data[0][amountIndex]);

      return {
        name,
        amount,
      };
    } catch (err) {
      return undefined;
    }
  }
}
