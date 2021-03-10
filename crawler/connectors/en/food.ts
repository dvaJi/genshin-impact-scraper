import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import { Food, PotionResult } from "@engine/Types";
import { saveImage } from "@helper/save-img";

export default class FoodCrawler extends Connector {
  BASE_URL = "https://genshin-impact.fandom.com";
  categories = ["/wiki/Food"];
  selectors = {
    urls: "table > tbody > tr > td:nth-child(2) > a",
    name: "#mw-content-text > div > aside > h2",
    description:
      "#mw-content-text > div > aside > section > div.pi-section-contents > div.pi-section-content.pi-section-active > figure > figcaption",
    rarity: "#mw-content-text > div > aside > div:nth-child(4) > div > img",
    sources: "#mw-content-text > div > aside > section > div > div",
    img: "#mw-content-text > div > aside > figure > a > img",
  };

  constructor() {
    super();
    super.id = Symbol("en_food");
    super.label = "en_food";
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
          storedContent.get("List of Food Items")?.join("") || "",
          this.selectors.urls
        )
      );
      materialsLink.push(
        ...this.parseTableLinks(
          storedContent.get("List of Special Dishes")?.join("") || "",
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

      const sources: string[] = [];
      doc.querySelectorAll(this.selectors.sources).forEach((value) => {
        sources.push(value.textContent?.trim() || "");
      });

      let craft: { name?: string; amount?: number }[] | undefined = undefined;
      const recipeDom = this.createDOM(
        `<div>${content.get("Recipe")?.join("")}</div>`
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

      let character = undefined;
      if (infoboxContent.has("Character")) {
        character = infoboxContent.get("Character");
      }

      let base = undefined;
      if (infoboxContent.has("Base Dish")) {
        base = infoboxContent.get("Base Dish");
      }

      let variant = undefined;
      if (infoboxContent.has("variant")) {
        variant = this.getTextContent(
          infoboxContent.get("variant") || "",
          "div > a"
        );
      }

      let description: string | undefined = undefined;
      let effect: string | undefined = undefined;
      let results:
        | {
            normal: PotionResult;
            delicious: PotionResult;
            suspicious: PotionResult;
          }
        | undefined = undefined;
      const tabsContent = doc.querySelectorAll(
        "#mw-content-text > div > aside > section > div.pi-section-contents > div.pi-section-content"
      );
      console.log(tabsContent.length);
      if (tabsContent && tabsContent.length > 1) {
        const imgNormal =
          tabsContent[0]
            .querySelector("figure > a > img")
            ?.getAttribute("src")
            ?.replace("/60?", "/256?") || "";
        await saveImage(imgNormal, "food", id + "_normal.png");

        const imgDelicious =
          tabsContent[1]
            .querySelector("figure > a > img")
            ?.getAttribute("src")
            ?.replace("/60?", "/256?") || "";
        await saveImage(imgDelicious, "food", id + "_delicious.png");

        const imgSuspicious =
          tabsContent[2]
            .querySelector("figure > a > img")
            ?.getAttribute("src")
            ?.replace("/60?", "/256?") || "";
        await saveImage(imgSuspicious, "food", id + "_suspicious.png");

        results = {
          normal: {
            description:
              tabsContent[0]
                .querySelector("figure > figcaption")
                ?.textContent?.trim() || "",
            effect:
              tabsContent[0]
                .querySelector("div > .pi-data-value")
                ?.textContent?.trim() || "",
          },
          delicious: {
            description:
              tabsContent[1]
                .querySelector("figure > figcaption")
                ?.textContent?.trim() || "",
            effect:
              tabsContent[1]
                .querySelector("div > .pi-data-value")
                ?.textContent?.trim() || "",
          },
          suspicious: {
            description:
              tabsContent[2]
                .querySelector("figure > figcaption")
                ?.textContent?.trim() || "",
            effect:
              tabsContent[2]
                .querySelector("div > .pi-data-value")
                ?.textContent?.trim() || "",
          },
        };
      } else {
        description = this.getTextContent(doc, this.selectors.description);
        effect = infoboxContent.get("Effect") || "";

        if (tabsContent && tabsContent.length > 0) {
          const imgSrc =
            tabsContent[0]
              .querySelector("figure > a > img")
              ?.getAttribute("src")
              ?.replace("/60?", "/256?") || "";

          if (imgSrc) {
            await saveImage(imgSrc, "food", id + ".png");
          }
        } else {
          const imgSrc =
            doc
              .querySelector(this.selectors.img)
              ?.getAttribute("src")
              ?.replace("/60?", "/256?") || "";
          if (imgSrc) {
            await saveImage(imgSrc, "food", id + ".png");
          }
        }
      }
      const food: Food = {
        id,
        name,
        material_type: ["Food"],
        type: "Consumables",
        description,
        craft,
        rarity,
        dish_type: this.getTextContentArray(
          infoboxContent.get("type") || "",
          "div > a"
        ),
        character,
        effect,
        variant,
        base,
        results,
      };

      this.saveFile(food, `/en/food/`, id);
    }
  }
}
