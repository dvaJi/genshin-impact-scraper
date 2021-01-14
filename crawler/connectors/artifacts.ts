import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import { saveImage } from "@helper/save-img";
import { Artifact } from "@engine/Types";

export default class CharactersCrawler extends Connector {
  BASE_URL = "https://genshin-impact.fandom.com";
  selectors = {
    urls: "table > tbody > tr > td:nth-child(1) > div > div.card_caption > a",
    name: "#mw-content-text > div > aside > h2",
    imgs:
      "#mw-content-text > div > aside > section > table > tbody > tr > td > a > img",
    names: "table > tbody > tr:nth-child(1) > th",
    descriptions: "table > tbody > tr:nth-child(2) > td > i",
    rarity:
      "#mw-content-text > div > aside > section.pi-item.pi-panel.pi-border-color > div.pi-panel-scroll-wrapper > ul > li",
    drops:
      "#mw-content-text > div > aside > section.pi-item.pi-panel.pi-border-color > div.pi-section-contents > div",
    // type: "#mw-content-text > div > aside > div:nth-child(3) > div > a",
    // description: "#mw-content-text > div > p:nth-child(6) > i",
    // base_atk:
    //   "#mw-content-text > div > aside > section.pi-item.pi-group.pi-border-color > table > tbody > tr > td:nth-child(1)",
    // substat:
    //   "#mw-content-text > div > aside > section.pi-item.pi-group.pi-border-color > table > tbody > tr > td:nth-child(2)",
    // substat_value:
    //   "#mw-content-text > div > aside > section.pi-item.pi-group.pi-border-color > table > tbody > tr > td:nth-child(3)",
    // passive: "#mw-content-text > div > aside > div:nth-child(10) > div",
    // bonus:
    //   "#mw-content-text > div > aside > section:nth-child(11) > div.pi-section-contents > div.pi-section-content.pi-section-active > div:nth-child(1) > div",
    // location: "#mw-content-text > div > aside > div:nth-child(6) > div > a",
    // series: "#mw-content-text > div > aside > div:nth-child(5) > div",
  };

  constructor() {
    super();
    super.id = Symbol("eng_artifacts");
    super.label = "eng_artifacts";
  }

  protected async crawl() {
    const request = new Request(
      `${this.BASE_URL}/wiki/Artifacts`,
      this.requestOptions
    );
    const dom = await this.fetchDOM(request);
    const storedContent = this.parseWikiContent(dom.window.document);

    const artifactsLinks: string[] = [
      ...this.parseTableLinks(
        storedContent.get("5-Piece Artifact Sets") || "",
        this.selectors.urls
      ),
      ...this.parseTableLinks(
        storedContent.get("1-Piece Artifact Sets") || "",
        this.selectors.urls
      ),
    ];

    for await (const link of artifactsLinks) {
      const { window } = await this.fetchDOM(
        new Request(this.BASE_URL + link, this.requestOptions)
      );

      const doc = window.document;

      const [drops, rarity] = this.getDropAndRarity(doc);

      const name =
        doc?.querySelector(this.selectors.name)?.textContent?.trim() || "";
      const id = this.slugify(name);

      let artifact: Artifact = {
        id,
        name:
          doc?.querySelector(this.selectors.name)?.textContent?.trim() || "",
        min_rarity: Math.min(...rarity),
        max_rarity: Math.max(...rarity),
        drop: drops,
      };

      const sets: any[] = [];

      doc.querySelectorAll(this.selectors.imgs).forEach((value) => {
        const artifactName =
          value.getAttribute("alt")?.replace(".png", "").replace("Item ", "") ||
          "";
        const type = this.getArtifactType(artifactName);
        sets.push({
          name: artifactName,
          type,
          img: value.getAttribute("src")?.replace("/60?", "/256?") || "",
        });
      });

      const artifactContent = this.parseWikiContent(doc);
      // const infoboxContent = this.getInfoboxContent(doc);
      const loreContent = artifactContent.get("Lore") || "";
      const loreEl = this.createDOM(loreContent);

      loreEl.window.document
        .querySelectorAll(this.selectors.descriptions)
        .forEach((value, index) => {
          sets[index] = {
            ...sets[index],
            description: value.textContent?.trim(),
          };
        });

      sets.forEach(async (set) => {
        (artifact as any)[set.type] = {
          id: this.slugify(set.name),
          name: set.name,
          description: set.description,
        };
        await saveImage(set.img, "artifacts", this.slugify(set.name) + ".png");
      });

      this.saveFile(JSON.stringify(artifact), "/artifacts/", id);
    }
  }

  getArtifactType(name: string) {
    if (name.toLowerCase().includes("flower")) {
      return "flower";
    } else if (name.toLowerCase().includes("plume")) {
      return "plume";
    } else if (name.toLowerCase().includes("sands")) {
      return "sands";
    } else if (name.toLowerCase().includes("goblet")) {
      return "goblet";
    } else if (name.toLowerCase().includes("circlet")) {
      return "circlet";
    }

    return "circlet";
  }

  getDropAndRarity(document: Document): [Record<string, string[]>, number[]] {
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

    return [dropMap, rarityIndex.map((v) => Number(v))];
  }
}
