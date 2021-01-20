import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import { Character, instanceOfSkill, Passive, Skill } from "@engine/Types";
import { saveImage } from "@helper/save-img";
import { tableJson } from "@helper/table-json";

export default class CharactersCrawler extends Connector {
  BASE_URL = "https://genshin-impact.fandom.com";
  selectors = {
    urls: "table > tbody > tr > td:nth-child(2) > a",
    name: "#mw-content-text > div > aside > h2",
    rarity:
      "#mw-content-text > div > aside > section.pi-item.pi-group.pi-border-color > table > tbody > tr > td:nth-child(1) > img",
    element:
      "#mw-content-text > div > aside > section.pi-item.pi-group.pi-border-color > table > tbody > tr > td:nth-child(3) > span",
    weapon:
      "#mw-content-text > div > aside > section.pi-item.pi-group.pi-border-color > table > tbody > tr > td:nth-child(2) > span",
    titles:
      "#mw-content-text > div > aside > section.pi-item.pi-panel.pi-border-color > div.pi-section-contents > div.pi-section-content.pi-section-active > section > section > section > div",
    description: "blockquote > p.pull-quote__text",
    img: "#pi-tab-0 > figure > a > img",
  };

  constructor() {
    super();
    super.id = Symbol("eng_characters");
    super.label = "eng_characters";
  }

  protected async crawl() {
    const request = new Request(
      `${this.BASE_URL}/wiki/Characters`,
      this.requestOptions
    );
    const dom = await this.fetchDOM(request);
    const storedContent = this.parseWikiContent(dom.window.document);

    const charactersLinks = this.parseTableLinks(
      storedContent.get("Playable Characters")?.join() || "",
      this.selectors.urls
    );

    for await (const link of charactersLinks) {
      const { window } = await this.fetchDOM(
        new Request(this.BASE_URL + link, this.requestOptions)
      );

      const doc = window.document;
      const characterContent = this.parseWikiContent(doc);
      const infoboxContent = this.getInfoboxContent(doc);

      const name = this.getTextContent(doc, this.selectors.name);
      const id = this.slugify(name);
      const description = this.getTextContent(
        characterContent.get("Personality")?.join() || "",
        this.selectors.description
      );
      const weapon_type = this.getTextContent(doc, this.selectors.weapon);
      const rarity = Number(
        doc
          .querySelector(this.selectors.rarity)
          ?.getAttribute("alt")
          ?.trim()
          .replace(/( Stars| Star)/, "")
      );
      const element = this.getTextContent(doc, this.selectors.element);
      const titles = this.getTextContentArray(doc, this.selectors.titles);

      const skills: Skill[] = [];
      const passives: Passive[] = [];

      const talentsTable = characterContent.get("Talents") || ["", ""];
      const imgs: string[] = [];
      const talentsUrl: string[] = [];
      const talents = tableJson(talentsTable[0], {
        skipHiddenRows: false,
        cellCb: (el, _, col) => {
          if (col === "Icon") {
            const url =
              el
                .querySelector("td > a > img")
                ?.getAttribute("data-src")
                ?.replace("/45?", "/256?") || "";
            if (url) {
              imgs.push(url);
            }
          } else if (col === "Name") {
            const url =
              el.querySelector("td:nth-child(2) > a")?.getAttribute("href") ||
              "";
            if (url) {
              talentsUrl.push(url);
            }
          }

          return el.textContent?.trim() || "";
        },
      });

      let count = 0;
      for await (const value of talents.data.filter((d) => d.length > 1)) {
        const imgUrl = imgs[count];
        const talentUrl = talentsUrl[count];
        const info = await this.getTalent(id, value, talentUrl, imgUrl);
        if (info) {
          if (instanceOfSkill(info)) {
            skills.push(info);
          } else {
            passives.push(info);
          }
          count++;
        }
      }

      // console.log("skills", skills);
      // console.log("passives", passives);

      // const constellations = [];
      // const ascension = [];

      const character: Character = {
        id,
        name,
        description,
        weapon_type,
        element,
        gender: infoboxContent.get("Sex") || "",
        region: infoboxContent.get("Nation") || "",
        rarity,
        location: infoboxContent.get("How to Obtain")?.includes("Wish")
          ? "Wish"
          : "Quest",
        titles,
        skills,
        passives,
      };

      // console.log(character);
      const img =
        doc?.querySelector(this.selectors.img)?.getAttribute("src") || "";
      await saveImage(img, `characters/${id}`, id + "_card.png");
      this.saveFile(JSON.stringify(character), "/characters/", id);
    }
  }

  async getTalent(
    characterId: string,
    talentInfo: string[],
    link: string,
    imgUrl: string
  ): Promise<Skill | Passive | null> {
    const [_, name, type] = talentInfo;

    if (name === "None") {
      return null;
    }

    const { window } = await this.fetchDOM(
      new Request(this.BASE_URL + link, this.requestOptions)
    );

    const doc = window.document;

    // const talentContent = this.parseWikiContent(doc);
    const infoboxContent = this.getInfoboxContent(doc);

    // console.log("talentContent", talentContent);

    const talentId = this.slugify(name);
    const description = this.stripHtml(
      this.getHtmlContent(infoboxContent.get("info") || "", "div > div"),
      this.STRIP_A_TAGS
    );

    // Save Image
    await saveImage(imgUrl, `characters/${characterId}`, talentId + ".png");

    if (
      [
        "Normal/Charged Attack",
        "Elemental Skill",
        "Elemental Burst",
        "Alternate Sprint",
      ].includes(type)
    ) {
      const skill: Skill = {
        id: talentId,
        name,
        type,
        description,
        modifiers: [],
      };
      return skill;
    } else {
      const passiveType = Number(type.replace("Passive Talent ", ""));
      let unlock = "";
      if (passiveType === 1) {
        unlock = "Ascension 1";
      } else if (passiveType === 2) {
        unlock = "Ascension 4";
      }

      const passive: Passive = {
        id: talentId,
        name,
        description,
        unlock,
      };

      return passive;
    }
  }
}
