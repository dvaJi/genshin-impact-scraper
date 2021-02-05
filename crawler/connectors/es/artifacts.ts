import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import { Artifact } from "@engine/Types";

export default class CharactersCrawler extends Connector {
  BASE_URL = "https://genshin-impact.fandom.com";
  selectors = {
    urls: "table > tbody > tr > td:nth-child(2) > a",
    id:
      "#WikiaMainContentContainer > nav.WikiaArticleInterlang > ul > li:nth-child(1) > a",
    name: "#mw-content-text > div > aside > h2",
    imgs: "#mw-content-text > div > aside > section > table > tbody > tr > td",
    names: "table > tbody > tr:nth-child(1) > th",
    descriptions: "table > tbody > tr:nth-child(2) > td > i",
    bonuses:
      "#mw-content-text > div > aside > section:nth-child(4) > div, #mw-content-text > div > aside > section:nth-child(3) > div",
    rarity:
      "#mw-content-text > div > aside > section.pi-item.pi-panel.pi-border-color > div.pi-panel-scroll-wrapper > ul > li",
    drops:
      "#mw-content-text > div > aside > section.pi-item.pi-panel.pi-border-color > div.pi-section-contents > div",
  };

  constructor() {
    super();
    super.id = Symbol("es_artifacts");
    super.label = "es_artifacts";
  }

  protected async crawl(): Promise<void> {
    const request = new Request(
      `${this.BASE_URL}/es/wiki/Artefactos`,
      this.requestOptions
    );
    const dom = await this.fetchDOM(request);
    const storedContent = this.parseWikiContent(dom.window.document);

    const artifactsLinks: string[] = [
      ...this.parseTableLinks(
        storedContent.get("Conjuntos[editar | editar código]")?.join() || "",
        this.selectors.urls
      ),
      ...this.parseTableLinks(
        storedContent
          .get("Conjuntos de 1 pieza[editar | editar código]")
          ?.join() || "",
        this.selectors.urls
      ),
    ];

    for await (const link of artifactsLinks) {
      const { window } = await this.fetchDOM(
        new Request(this.BASE_URL + link, this.requestOptions)
      );

      const doc = window.document;
      const infoboxContent = this.getInfoboxContent(
        doc,
        undefined,
        "#mw-content-text > div > aside > section > div"
      );

      const drops = this.getDrops(doc);

      const name = this.getTextContent(doc, this.selectors.name);
      const englishLink =
        doc.querySelector(this.selectors.id)?.getAttribute("href") || "";
      const id = this.slugify(
        decodeURI(englishLink.replace(/.*\/wiki\/(.*)/g, "$1"))
      );

      // console.log(infoboxContent);

      const artifact: Partial<Artifact> = {
        id,
        name,
        drop: drops,
      };

      const onepc = infoboxContent.get("1 pieza");
      const twopc = infoboxContent.get("2 piezas");
      const fourpc = infoboxContent.get("4 piezas");

      if (onepc) {
        artifact["1pc"] = onepc;
      } else {
        artifact["2pc"] = twopc;
        artifact["4pc"] = fourpc;
      }

      const sets: { name: string; type: string; description?: string }[] = [];

      doc.querySelectorAll(this.selectors.imgs).forEach((value) => {
        const imgDom = value.querySelector("td > a > img");
        const artifactName =
          imgDom
            ?.getAttribute("alt")
            ?.replace(".png", "")
            .replace("Item ", "") || "";
        const type = value.getAttribute("data-source") || "";
        sets.push({
          name: artifactName,
          type,
        });
      });

      console.log(sets);

      const artifactContent = this.parseWikiContent(doc);
      console.log(artifactContent)
      const descriptions = this.getTextContentArray(
        artifactContent.get("Historia[editar | editar código]")?.join() || "",
        this.selectors.descriptions
      );

      descriptions.forEach((description, index) => {
        sets[index] = {
          ...sets[index],
          description,
        };
      });

      sets.forEach(async (set) => {
        (artifact as any)[set.type] = {
          id: this.slugify(set.name),
          name: set.name,
          description: set.description,
        };
      });

      this.saveFile(JSON.stringify(artifact, undefined, 2), "/es/artifacts/", id);
      // break;
    }
  }

  getDrops(document: Document): Record<string, string[]> {
    const rarityIndex: string[] = [];
    const dropMap: Record<string, string[]> = {};
    // Get rarity
    document.querySelectorAll(this.selectors.rarity).forEach((value) => {
      rarityIndex.push(value.textContent?.trim().replace("★", "") || "");
    });

    document.querySelectorAll(this.selectors.drops).forEach((value) => {
      const index = value.getAttribute("data-ref");
      const drops: string[] = [];
      value.querySelectorAll(".pi-data-value").forEach((source) => {
        drops.push(source.textContent?.trim() || "");
      });

      dropMap[rarityIndex[Number(index)]] = drops;
    });

    return dropMap;
  }
}
