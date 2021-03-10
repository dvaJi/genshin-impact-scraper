import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import { Material } from "@engine/Types";
import { finalId, findMaterialFolder } from "@helper/create-es-materials-index";

export default class CookingIngredientsCrawler extends Connector {
  BASE_URL = "https://genshin-impact.fandom.com";
  categories = ["/es/wiki/Categoría:Ingredientes_culinarios"];
  selectors = {
    urls: "#mw-content-text > div.category-page__members > ul > li > a",
    id:
      "#WikiaMainContentContainer > nav.WikiaArticleInterlang > ul > li:nth-child(1) > a",
    name: "#mw-content-text > div > aside > h2",
    rarity:
      "#mw-content-text > div > aside > section:nth-child(3) > div:nth-child(3) > div > a:nth-child(2) > img",
  };

  constructor() {
    super();
    super.id = Symbol("es_cooking_ingredients");
    super.label = "es_cooking_ingredients";
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
          materialsLink.push(value.getAttribute("href") || "");
        });
    }

    for await (const link of materialsLink) {
      const { window } = await this.fetchDOM(
        new Request(this.BASE_URL + link, this.requestOptions)
      );
      const doc = window.document;
      const content = this.parseWikiContent(doc);

      const name = this.getTextContent(doc, this.selectors.name);
      const englishLink =
        doc.querySelector(this.selectors.id)?.getAttribute("href") || name;
      const id = finalId(
        this.slugify(decodeURI(englishLink.replace(/.*\/wiki\/(.*)/g, "$1")))
      );

      const description = (
        this.getTextContent(content.get("Initial")?.join("") || "", "*") ||
        this.getTextContent(doc, "blockquote > p, p:nth-child(1)")
      )
        .replace(/(«|»)/, "")
        .trim();

      let craft:
        | { name?: string; amount?: number; cost?: number }
        | undefined = undefined;

      const craftDom = this.createDOM(
        `<div>${content
          .get("Obtención[editar | editar código]")
          ?.join("")}</div>`
      );
      craftDom.window.document
        .querySelectorAll(".ingrediente-receta")
        .forEach((value) => {
          const amount = Number(
            value
              .querySelector(".cantidad-ingrediente-receta")
              ?.textContent?.trim()
              .replace("x", "")
          );

          const mName = value
            .querySelector(".collapsable-item-name")
            ?.textContent?.trim();

          if (mName !== name) {
            craft = {
              name: mName,
              amount,
            };
          }
        });

      const material: Partial<Material> = {
        id,
        name,
        description,
        craft,
      };

      this.saveFile(material, `/es/ingredients/`, id);
    }
  }
}
