import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import { Material } from "@engine/Types";
import { saveImage } from "@helper/save-img";

export default class CookingIngredientsCrawler extends Connector {
  BASE_URL = "https://genshin-impact.fandom.com";
  categories = ["/wiki/Category:Cooking_Ingredient"];
  selectors = {
    urls: "#mw-content-text > div.category-page__members > ul > li > a",
    name: "#mw-content-text > div > aside > h2",
    rarity: "#mw-content-text > div > aside > div:nth-child(4) > div > img",
    sources: "#mw-content-text > div > aside > section > div > div",
    img:
      "#mw-content-text > div > aside > figure > a > img,#pi-tab-0 > figure > a > img",
  };

  constructor() {
    super();
    super.id = Symbol("en_cooking_ingredients");
    super.label = "en_cooking_ingredients";
  }

  protected async crawl(): Promise<void> {
    const materialsLink: string[] = [];

    for await (const category of this.categories) {
      const request = new Request(
        `${this.BASE_URL}${category}`,
        this.requestOptions
      );
      const dom = await this.fetchDOM(request);
      dom.window.document
        .querySelectorAll(this.selectors.urls)
        .forEach((value) => {
          const href = value.getAttribute("href") || "";
          if (href && !href.startsWith("/wiki/Category:")) {
            materialsLink.push(href);
          }
        });
    }

    for await (const link of materialsLink) {
      const { window } = await this.fetchDOM(
        new Request(this.BASE_URL + link, this.requestOptions)
      );
      const doc = window.document;
      const content = this.parseWikiContent(doc);
      const infoboxContent = this.getInfoboxContent(doc);

      const name = this.getTextContent(doc, this.selectors.name);
      const id = this.slugify(name);

      const description = this.getTextContent(
        infoboxContent.get("description") || "",
        ".pi-data-value"
      );

      const sources: string[] = [];
      doc.querySelectorAll(this.selectors.sources).forEach((value) => {
        sources.push(value.textContent?.trim() || "");
      });

      let craft:
        | { name?: string; amount?: number; cost?: number }
        | undefined = undefined;
      const alchemyDom = this.createDOM(
        `<div>${content.get("Processing")?.join("")}</div>`
      );
      alchemyDom.window.document
        .querySelectorAll("div > div")
        .forEach((value) => {
          if (craft === undefined) {
            craft = {};
          }
          const amount = Number(
            value.querySelector("div > div")?.textContent?.trim()
          );
          const link = value.querySelector("div > a");
          const url = link?.getAttribute("href") || "";
          if (url !== "/wiki/Alchemy") {
            if (url === "/wiki/Mora") {
              craft.cost = amount || craft.cost;
            } else {
              craft.name = link?.getAttribute("Title") || craft.name;
              craft.amount = amount || craft.amount;
            }
          }
        });

      const rarity =
        Number(
          doc
            ?.querySelector(this.selectors.rarity)
            ?.getAttribute("alt")
            ?.trim()
            .replace(/( Stars| Star)/, "")
        ) || undefined;

      const material: Material = {
        id,
        name,
        material_type: ["Cooking Ingredient"],
        type: "Cooking Ingredient",
        description,
        craft,
        rarity,
      };

      const imgSrc =
        doc
          .querySelector(this.selectors.img)
          ?.getAttribute("src")
          ?.replace("/60?", "/256?") || "";

      await saveImage(imgSrc, "ingredients", id + ".png");

      this.saveFile(material, `/en/ingredients/`, id);
    }
  }
}
