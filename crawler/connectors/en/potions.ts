import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import { Potion } from "@engine/Types";
import { saveImage } from "@helper/save-img";

export default class PotionsCrawler extends Connector {
  BASE_URL = "https://genshin-impact.fandom.com";
  categories = ["/wiki/Potions"];
  selectors = {
    urls: "table > tbody > tr > td:nth-child(2) > a",
    name: "#mw-content-text > div > aside > h2",
    description: ".pi-data-value",
    effect: ".pi-data-value",
    rarity: "#mw-content-text > div > aside > div:nth-child(4) > div > img",
    sources:
      "#mw-content-text > div > aside > section > div > .pi-data-value > a",
    img: "#mw-content-text > div > aside > figure > a > img",
  };

  constructor() {
    super();
    super.id = Symbol("en_potions");
    super.label = "en_potions";
  }

  protected async crawl(): Promise<void> {
    const materialsLink: string[] = [];

    for await (const category of this.categories) {
      const request = new Request(
        `${this.BASE_URL}${category}`,
        this.requestOptions
      );
      const dom = await this.fetchDOM(request);
      const storedContent = this.parseWikiContent(dom.window.document);
      materialsLink.push(
        ...this.parseTableLinks(
          storedContent.get("List of Potions")?.join("") || "",
          this.selectors.urls
        )
      );
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
      console.log(infoboxContent);
      const description = this.getTextContent(
        infoboxContent.get("description") || "",
        this.selectors.description
      );

      const sources: string[] = [];
      doc.querySelectorAll(this.selectors.sources).forEach((value) => {
        sources.push(value.textContent?.trim() || "");
      });

      let craft: { name?: string; amount?: number }[] | undefined = undefined;
      const recipeDom = this.createDOM(
        `<div>${content.get("Alchemy")?.join("")}</div>`
      );
      recipeDom.window.document
        .querySelectorAll(".genshin_recipe > .card_container")
        .forEach((value) => {
          if (craft === undefined) {
            craft = [];
          }
          const amount = Number(
            value.querySelector(".card_text > span")?.textContent?.trim()
          );
          const link = value.querySelector("div > a");
          craft.push({
            amount,
            name: link?.getAttribute("title") || "",
          });
        });

      const rarity =
        Number(
          this.getAttributeValue(
            infoboxContent.get("rarity") || "",
            "div > img",
            "alt"
          ).replace(/( Stars| Star)/, "")
        ) || undefined;

      const potion: Potion = {
        id,
        name,
        description,
        material_type: ["Potions"],
        type: "Consumables",
        craft,
        rarity,
        sources,
        effect: this.getTextContent(
          infoboxContent.get("effect") || "",
          this.selectors.effect
        ),
      };

      const imgSrc =
        doc
          .querySelector(this.selectors.img)
          ?.getAttribute("src")
          ?.replace("/60?", "/256?") || "";

      await saveImage(imgSrc, "potions", id + ".png");

      this.saveFile(potion, `/en/potions/`, id);
    }
  }
}
