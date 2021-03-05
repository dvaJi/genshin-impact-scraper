import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import { Material } from "@engine/Types";
import { tableJson } from "@helper/table-json";

export default class CharactersCrawler extends Connector {
  BASE_URL = "https://gamewith.jp";
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
    super.id = Symbol("jap_materials");
    super.label = "jap_materials";
  }

  protected async crawl(): Promise<void> {
    const request = new Request(
      `${this.BASE_URL}/genshin/article/show/231208`,
      this.requestOptions
    );
    const dom = await this.fetchDOM(request);
    const storedContent = this.parseWikiContent(
      dom.window.document,
      "#article-body > *"
    );
    const materialTable = tableJson(
      storedContent.get(`素材・アイテム一覧から検索`)?.join() || "",
      {
        cellCb: (el, index, col) => {
          if (col === "素材名") {
            if (el.querySelector("td > span")?.textContent) {
              return `${el
                .querySelector("td > a")
                ?.textContent?.trim()}|${el
                .querySelector("td > span")
                ?.textContent?.trim()}`;
            }

            return el.querySelector("td > a")?.textContent?.trim() || "";
          }

          return el.textContent?.trim() || "";
        },
      }
    );

    for await (const value of materialTable.data) {
      const [name, description] = value;
      if (name === "素材名") {
        continue;
      }

      const id = name.replace("|", "__");

      const material: Partial<Material> = {
        id,
        name: name.split("|")[0],
        description,
      };

      this.saveFile(material, "/jp/materials/", id);
    }
  }
}
