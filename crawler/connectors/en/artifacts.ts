import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import { saveImage } from "@helper/save-img";
import { Artifact } from "@engine/Types";

export default class CharactersCrawler extends Connector {
  BASE_URL = "https://genshin-impact.fandom.com";
  selectors = {
    urls: "table > tbody > tr > td:nth-child(1) > div > div.card_caption > a",
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
    super.id = Symbol("eng_artifacts");
    super.label = "eng_artifacts";
  }

  protected async crawl(): Promise<void> {
    const request = new Request(
      `${this.BASE_URL}/wiki/Artifacts`,
      this.requestOptions
    );
    const dom = await this.fetchDOM(request);
    const storedContent = this.parseWikiContent(dom.window.document);

    const artifactsLinks: string[] = [
      ...this.parseTableLinks(
        storedContent.get("2-4 Piece Artifact Sets")?.join() || "",
        this.selectors.urls
      ),
      ...this.parseTableLinks(
        storedContent.get("1-Piece Artifact Sets")?.join() || "",
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

      const artifact: Artifact = {
        id,
        name:
          doc?.querySelector(this.selectors.name)?.textContent?.trim() || "",
        min_rarity: Math.min(...rarity),
        max_rarity: Math.max(...rarity),
        drop: drops,
      };

      doc.querySelectorAll(this.selectors.bonuses).forEach((value) => {
        const source = value.getAttribute("data-source");
        let piecesKey: "1pc" | "2pc" | "4pc" = "1pc";
        if (source === "2pcBonus") {
          piecesKey = "2pc";
        } else if (source === "4pcBonus") {
          piecesKey = "4pc";
        }

        artifact[piecesKey] = value
          ?.querySelector("div > div")
          ?.textContent?.trim();
      });

      const sets: {
        name: string;
        type: string;
        img: string;
        description?: string;
      }[] = [];

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
          img: imgDom?.getAttribute("src")?.replace("/60?", "/256?") || "",
        });
      });

      const artifactContent = this.parseWikiContent(doc);
      // const infoboxContent = this.getInfoboxContent(doc);
      const descriptions = this.getTextContentArray(
        artifactContent.get("Lore")?.join() || "",
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
        await saveImage(set.img, "artifacts", this.slugify(set.name) + ".png");

        if (set.type === "flower") {
          await saveImage(set.img, "artifacts", id + ".png");
        }
      });

      this.saveFile(artifact, "/en/artifacts/", id);
    }
  }

  getArtifactType(
    name: string
  ): "flower" | "plume" | "sands" | "goblet" | "circlet" {
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
