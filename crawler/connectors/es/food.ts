import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import { Food } from "@engine/Types";
import { finalId } from "@helper/create-es-materials-index";

export default class FoodCrawler extends Connector {
  BASE_URL = "https://genshin-impact.fandom.com";
  categories = ["/es/wiki/Platillos"];
  selectors = {
    urls: "center > div > div > a",
    urls_specials: "center > div > div:nth-child(2) > a",
    id:
      "#WikiaMainContentContainer > nav.WikiaArticleInterlang > ul > li:nth-child(1) > a",
    name: "#mw-content-text > div > aside > h2",
    rarity:
      "#mw-content-text > div > aside > section:nth-child(3) > div:nth-child(3) > div > a:nth-child(2) > img",
  };

  constructor() {
    super();
    super.id = Symbol("es_food");
    super.label = "es_food";
  }

  protected async crawl(): Promise<void> {
    let materialsLink: string[] = [];

    for await (const category of this.categories) {
      const request = new Request(
        `${this.BASE_URL}${category}`,
        this.requestOptions
      );
      const dom = await this.fetchDOM(request);
      const storedContent = this.parseWikiContent(dom.window.document);

      materialsLink = [
        ...this.parseTableLinks(
          storedContent.get("Platillos[editar | editar código]")?.join() || "",
          this.selectors.urls
        ),
        ...this.parseTableLinks(
          storedContent
            .get("Platillos especiales[editar | editar código]")
            ?.join() || "",
          this.selectors.urls_specials
        ),
      ];
    }

    for await (const link of materialsLink) {
      const { window } = await this.fetchDOM(
        new Request(this.BASE_URL + link, this.requestOptions)
      );
      const doc = window.document;
      const content = this.parseWikiContent(doc);
      const infoboxContent = this.getInfoboxContent(
        doc,
        "#mw-content-text > div > aside > section > *"
      );

      const name = this.getTextContent(doc, this.selectors.name);
      const englishLink =
        doc.querySelector(this.selectors.id)?.getAttribute("href") || name;
      const id = finalId(
        this.slugify(decodeURI(englishLink.replace(/.*\/wiki\/(.*)/g, "$1")))
      );

      const description = this.getTextContent(
        content.get("Initial")?.join("") || "",
        "blockquote > p"
      )
        .replace(/(«)/, "")
        .replace(/(\s*»|»)/, "")
        .trim();

      let craft: { name?: string; amount?: number }[] | undefined = undefined;

      const craftDom = this.createDOM(
        `<div>${content.get("Receta[editar | editar código]")?.join("")}</div>`
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
            if (craft === undefined) {
              craft = [];
            }
            craft.push({
              name: mName,
              amount,
            });
          }
        });

      const effect = this.getTextContent(
        content.get("Efecto[editar | editar código]")?.join("") || "",
        "ul > li"
      );

      let variant = undefined;
      if (infoboxContent.has("especial")) {
        variant = this.getTextContent(
          infoboxContent.get("especial") || "",
          "div > div > a:nth-child(1),div > div > a"
        );
      }

      let character = undefined;
      if (infoboxContent.has("personaje")) {
        character = this.getTextContent(
          infoboxContent.get("personaje") || "",
          ".pi-data-value > a"
        );
      }

      let base = undefined;
      if (infoboxContent.has("base")) {
        base = this.getTextContent(
          infoboxContent.get("base") || "",
          ".pi-data-value > a"
        );
      }

      const material: Partial<Food> = {
        id,
        name,
        description,
        craft,
        effect,
        variant,
        base,
        character,
      };

      this.saveFile(material, `/es/food/`, id);
    }
  }
}
