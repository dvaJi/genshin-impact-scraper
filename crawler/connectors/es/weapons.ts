import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import { Weapon } from "@engine/Types";

export default class CharactersCrawler extends Connector {
  BASE_URL = "https://genshin-impact.fandom.com";
  weapons = ["Espadas", "Claymores", "Lanzas", "Catalizadores", "Arcos"];
  selectors = {
    urls: "center > div > div > div > div > a",
    id:
      "#WikiaMainContentContainer > nav.WikiaArticleInterlang > ul > li:nth-child(1) > a",
    name: "#mw-content-text > div > aside > h2",
    img: "#mw-content-text > div > aside > figure > a > img",
    description: "#mw-content-text > div > div.cita > blockquote > p",
    bonus: "table > tbody > tr:nth-child(2) > td:nth-child(2)",
  };

  constructor() {
    super();
    super.id = Symbol("spanish_weapons");
    super.label = "spanish_weapons";
  }

  protected async crawl(): Promise<void> {
    let weaponsLinks: string[] = [];

    for await (const weaponName of this.weapons) {
      const request = new Request(
        `${this.BASE_URL}/es/wiki/${weaponName}`,
        this.requestOptions
      );
      const dom = await this.fetchDOM(request);
      const storedContent = this.parseWikiContent(dom.window.document);

      weaponsLinks = [
        ...weaponsLinks,
        ...this.parseTableLinks(
          storedContent.get("Armas[editar | editar código]")?.join() || "",
          this.selectors.urls
        ),
      ];
    }

    // console.log("weaponsLinks", weaponsLinks);
    for await (const link of weaponsLinks) {
      const { window } = await this.fetchDOM(
        new Request(this.BASE_URL + link, this.requestOptions)
      );

      const doc = window.document;

      const weaponContent = this.parseWikiContent(doc);

      const name = this.getTextContent(doc, this.selectors.name);
      const englishLink =
        doc.querySelector(this.selectors.id)?.getAttribute("href") || "";
      const id = this.slugify(
        decodeURI(englishLink.replace(/.*\/wiki\/(.*)/g, "$1"))
      );

      const weapon: Partial<Weapon> = {
        id,
        name,
        description: this.getTextContent(doc, this.selectors.description)
          .replace(/(«|»)/, "")
          .trim(),
        bonus: this.getTextContent(
          weaponContent.get("Efecto pasivo[editar | editar código]")?.join() ||
            "",
          this.selectors.bonus
        ),
      };

      this.saveFile(JSON.stringify(weapon), "/es/weapons/", id);
    }
  }
}
