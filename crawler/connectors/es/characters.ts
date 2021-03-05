import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import {
  Ascension,
  Character,
  Constellation,
  DeepPartial,
  instanceOfSkill,
  Passive,
  Skill,
} from "@engine/Types";
import { tableJson } from "@helper/table-json";

export default class CharactersCrawler extends Connector {
  BASE_URL = "https://genshin-impact.fandom.com";
  selectors = {
    urls: "table > tbody > tr > td:nth-child(1) > a",
    id:
      "#WikiaMainContentContainer > nav.WikiaArticleInterlang > ul > li:nth-child(1) > a",
    name: "#mw-content-text > div > aside > h2",
    description: "blockquote > p, p:nth-child(1)",
  };

  constructor() {
    super();
    super.id = Symbol("es_characters");
    super.label = "es_characters";
  }

  protected async crawl(): Promise<void> {
    const request = new Request(
      `${this.BASE_URL}/es/wiki/Personajes`,
      this.requestOptions
    );
    const dom = await this.fetchDOM(request);
    const storedContent = this.parseWikiContent(dom.window.document);

    const charactersLinks = this.parseTableLinks(
      storedContent.get("Jugables[editar | editar código]")?.join() || "",
      this.selectors.urls
    ).filter((u) => u !== "/es/wiki/Viajero");

    for await (const link of charactersLinks) {
      const { window } = await this.fetchDOM(
        new Request(this.BASE_URL + link, this.requestOptions)
      );

      const doc = window.document;
      const characterContent = this.parseWikiContent(doc);
      const infoboxContent = this.getInfoboxContent(
        doc,
        undefined,
        "#mw-content-text > div > aside > section > div"
      );

      const name = this.getTextContent(doc, this.selectors.name);
      const englishLink =
        doc.querySelector(this.selectors.id)?.getAttribute("href") || "";
      const id =
        this.slugify(decodeURI(englishLink.replace(/.*\/wiki\/(.*)/g, "$1"))) ||
        name.toUpperCase();
      const description = this.getTextContent(
        characterContent.get("Perfil[editar | editar código]")?.join() || "",
        this.selectors.description
      )
        .replace(/(«|»)/g, "")
        .trim();

      const constellations: Partial<Constellation>[] = [];
      const constellationsTable = tableJson(
        characterContent.get("Constelación[editar | editar código]")?.join() ||
          "",
        {
          cellSelector: "tr > td, tr > th",
        }
      );

      for await (const value of constellationsTable.data) {
        const [level, name, description] = value;
        if (level === "Nivel") {
          continue;
        }

        constellations.push({
          name,
          description,
          level: Number(level),
        });
      }

      const ascensions: DeepPartial<Ascension>[] = [];
      const ascensionTable = tableJson(
        characterContent.get("Ascensión[editar | editar código]")?.join() || "",
        { cellSelector: "tr > td, tr > th" }
      );

      const separator = /(\d{1,2})/;
      for await (const value of ascensionTable.data) {
        const [ascension, _, __, elmat1, elmat2, elmat3, elmat4] = value;
        if (ascension === "Máx" || ascension === "Ascensión") {
          continue;
        }

        const mat1 = {
          name: elmat1.split(separator).filter(Boolean)[1].trim(),
        };

        let mat2 = undefined;
        if (elmat2 !== "Ninguno") {
          mat2 = {
            name: elmat2.split(separator).filter(Boolean)[1].trim(),
          };
        }

        const mat3 = {
          name: elmat3.split(separator).filter(Boolean)[1].trim(),
        };

        const mat4 = {
          name: elmat4.split(separator).filter(Boolean)[1].trim(),
        };

        ascensions.push({
          mat1,
          mat2,
          mat3,
          mat4,
        });
      }

      const skills: Partial<Skill>[] = [];
      const passives: Partial<Passive>[] = [];

      const talentsTable = characterContent.get(
        "Talentos[editar | editar código]"
      ) || ["", ""];
      const talentsUrl: string[] = [];
      const talents = tableJson(talentsTable[0], {
        skipHiddenRows: false,
        cellCb: (el, _, col) => {
          if (col === "Habilidad") {
            const url =
              el.querySelector("td > a:nth-child(1)")?.getAttribute("href") ||
              "";
            if (url) {
              talentsUrl.push(url);
            }
          }

          return el.textContent?.trim() || "";
        },
      });
      // console.log(talentsUrl);

      let count = 0;
      for await (const value of talents.data.filter((d) => d.length > 1)) {
        const talentUrl = talentsUrl[count];
        if (!talentUrl) continue;

        const info = await this.getTalent(value, talentUrl);
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

      const character: DeepPartial<Character> = {
        id,
        name,
        description,
        titles: (infoboxContent.get("Títulos") || "").split("  "),
        skills,
        passives,
        constellations,
        ascension: ascensions,
      };

      // console.log(character);
      this.saveFile(character, "/es/characters/", id);
    }
  }

  async getTalent(
    talentInfo: string[],
    link: string
  ): Promise<Partial<Skill> | Partial<Passive> | null> {
    const [name] = talentInfo;

    const { window } = await this.fetchDOM(
      new Request(this.BASE_URL + link, this.requestOptions)
    );

    const doc = window.document;

    const talentContent = this.parseWikiContent(doc);
    const infoboxContent = this.getInfoboxContent(
      doc,
      undefined,
      "#mw-content-text > div > aside > section > div"
    );

    // console.log("talentContent", talentContent);

    const englishLink =
      doc.querySelector(this.selectors.id)?.getAttribute("href") || "";
    const talentId = this.slugify(
      decodeURI(englishLink.replace(/.*\/wiki\/(.*)/g, "$1"))
    );

    const description = this.stripHtml(
      this.cleanHtml(
        this.getHtmlContent(
          talentContent.get("Descripción[editar | editar código]")?.join("") ||
            "",
          "*"
        )
      ),
      this.STRIP_A_TAGS
    );
    const type = infoboxContent.get("Tipo de talento") || "";

    if (
      [
        "Ataque normal",
        "Habilidad elemental",
        "Impulso elemental",
        "Esprintar alternativo",
      ].includes(type)
    ) {
      const skill: Partial<Skill> = {
        id: talentId,
        name,
        type,
        description,
        modifiers: [],
      };
      return skill;
    } else {
      const passive: Partial<Passive> = {
        id: talentId,
        name,
        description,
      };

      return passive;
    }
  }

  cleanHtml(value: string): string {
    return value
      .replace("<head></head><body>", "")
      .replace(/\n/g, "")
      .replace("</body>", "")
      .replace('<br clear="all">', "")
      .replace("<p></p>", "");
  }
}
