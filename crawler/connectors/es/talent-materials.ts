import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import { Material } from "@engine/Types";

export default class CharactersCrawler extends Connector {
  BASE_URL = "https://genshin-impact.fandom.com";
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
    super.id = Symbol("es_ascension_materials");
    super.label = "es_ascension_materials";
  }

  protected async crawl(): Promise<void> {
    const request = new Request(
      `${this.BASE_URL}/es/wiki/Categoría:Materiales_de_mejora_de_talento`,
      this.requestOptions
    );
    const dom = await this.fetchDOM(request);

    const materialsLink: string[] = [];
    dom.window.document
      .querySelectorAll(this.selectors.urls)
      .forEach((value) => {
        materialsLink.push(value.getAttribute("href") || "");
      });

    for await (const link of materialsLink) {
      const { window } = await this.fetchDOM(
        new Request(this.BASE_URL + link, this.requestOptions)
      );
      const doc = window.document;
      const content = this.parseWikiContent(doc);

      const name = this.getTextContent(doc, this.selectors.name);
      const englishLink =
        doc.querySelector(this.selectors.id)?.getAttribute("href") || "";
      const id = this.slugify(
        decodeURI(englishLink.replace(/.*\/wiki\/(.*)/g, "$1"))
      );

      const description = (
        this.getTextContent(
          content.get("Descripción[editar | editar código]")?.join("") || "",
          "*"
        ) || this.getTextContent(doc, "blockquote > p, p:nth-child(1)")
      )
        .replace(/(«|»)/, "")
        .trim();

      const rarity = Number(
        doc
          .querySelector(this.selectors.rarity)
          ?.getAttribute("alt")
          ?.trim()
          .replace(/( Stars| Star)/, "") || ""
      );

      const material: Partial<Material> = {
        id,
        name,
        description,
        rarity,
      };

      this.saveFile(material, "/es/materials/", id);
    }
  }
}
