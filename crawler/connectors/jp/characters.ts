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
  BASE_URL = "https://gamewith.jp/genshin";
  selectors = {
    urls: "table > tbody > tr > td:nth-child(1) > a",
    id:
      "#WikiaMainContentContainer > nav.WikiaArticleInterlang > ul > li:nth-child(1) > a",
    name:
      "body > div.page-wrap > div > div.main-wrap > div.main-col-wrap > div.c-box.w-for-tips-custom-style > div.article-hero > div.article-top.in-article > div.flex-box > h1 > span._main",
    description: "*",
  };

  constructor() {
    super();
    super.id = Symbol("es_characters");
    super.label = "es_characters";
  }

  protected async crawl(): Promise<void> {
    const request = new Request(
      `${this.BASE_URL}/article/show/231192`,
      this.requestOptions
    );
    const dom = await this.fetchDOM(request);
    const storedContent = this.parseWikiContent(
      dom.window.document,
      "#article-body > *"
    );

    const charactersLinks = this.parseTableLinks(
      storedContent.get("キャラ評価一覧")?.join() || "",
      this.selectors.urls
    );

    for await (const link of charactersLinks) {
      const { window } = await this.fetchDOM(
        new Request(link, this.requestOptions)
      );

      const doc = window.document;
      const characterContent = this.parseWikiContent(doc, "#article-body > *");

      const name = this.getTextContent(doc, this.selectors.name).replace(
        "の評価とおすすめ聖遺物・武器",
        ""
      );
      const id = name;
      const description = this.getTextContent(
        characterContent.get("人物紹介")?.join() || "",
        this.selectors.description
      )
        .replace(/拡大する,,/g, "")
        .trim();

      const constellations: Partial<Constellation>[] = [];
      const constellationsTable = tableJson(
        characterContent.get(`${name}の命の星座`)?.join() || "",
        {
          cellSelector: "tr > td, tr > th",
        }
      );

      for await (const value of constellationsTable.data) {
        const [name, description] = value;
        if (name === "スキル") {
          continue;
        }

        constellations.push({
          name: name.replace(/\s【\d凸で解放】/g, ""),
          description,
          level: Number(name.replace(/.*【(\d)凸で解放】/g, "$1")),
        });
      }

      const ascensions: DeepPartial<Ascension>[] = [];
      const ascensionTable = tableJson(
        characterContent.get("レベル上限突破に必要な素材")?.join() || "",
        { cellSelector: "tr > td, tr > th" }
      );

      for await (const value of ascensionTable.data) {
        const materials = value[1].split(/×\d*/g);
        let mat1Name = "";
        let mat3Name = "";
        let mat4Name = "";
        let mat2 = undefined;

        if (materials.length === 4) {
          mat1Name = materials[0];
          mat3Name = materials[1];
          mat4Name = materials[2];
        } else {
          mat1Name = materials[0];
          mat3Name = materials[2];
          mat4Name = materials[3];
          mat2 = {
            name: materials[1],
          };
        }

        ascensions.push({
          mat1: {
            name: mat1Name,
          },
          mat2,
          mat3: {
            name: mat3Name,
          },
          mat4: {
            name: mat4Name,
          },
        });
      }

      const h2Content = this.parseWikiContent(doc, "#article-body > *", ["H2"]);
      const talentsDom = this.createDOM(
        h2Content.get(`${name}の天賦(スキル)`)?.join("") || ""
      );
      const h3Content = this.parseWikiContent(talentsDom.window.document, "*", [
        "H3",
      ]);
      const skills: Partial<Skill>[] = this.getSkills(h3Content);
      const passives: Partial<Passive>[] = this.getPassives(h3Content);

      // console.log("skills", skills);
      // console.log("passives", passives);

      const character: DeepPartial<Character> = {
        id,
        name,
        description,
        skills,
        passives,
        constellations,
        ascension: ascensions,
      };

      // console.log(character);
      this.saveFile(
        JSON.stringify(character, undefined, 2),
        "/jp/characters/",
        id
      );
    }
  }

  getSkills(content: Map<string, string[]>): Partial<Skill>[] {
    const skills: Partial<Skill>[] = [];
    content.forEach((value, key) => {
      if (key !== "Initial" && key !== "パッシブスキル") {
        const skill: Partial<Skill> = {};
        if (key.startsWith("通常攻撃")) {
          const names = this.getTextContentArray(value.join(""), "h4");
          const descriptions = this.getTextContentArray(
            value.join(""),
            "table > tbody > tr:nth-child(2) > td"
          ).filter((t) => t.length > 10);
          skill.name = key.replace("通常攻撃・", "");
          skill.type = "通常攻撃";
          skill.description = names
            .map(
              (name, index) => `<p><b>${name}:</b>${descriptions[index]}</p>`
            )
            .join("");
        }
        if (key.endsWith("(元素スキル)")) {
          const names = this.getTextContentArray(value.join(""), "h4");
          const descriptions = this.getTextContentArray(
            value.join(""),
            "table > tbody > tr:nth-child(2) > td"
          ).filter((t) => t.length > 10);
          skill.name = key.replace("(元素スキル)", "");
          skill.type = "元素スキル";
          if (descriptions.length > names.length) {
            skill.description =
              `<p>${descriptions[0]}</p>` +
              names
                .map(
                  (name, index) =>
                    `<p><b>${name}:</b>${descriptions[index + 1]}</p>`
                )
                .join("");
          } else {
            skill.description = names
              .map(
                (name, index) => `<p><b>${name}:</b>${descriptions[index]}</p>`
              )
              .join("");
          }
        }
        if (key.endsWith("(元素爆発)")) {
          const names = this.getTextContentArray(value.join(""), "h4");
          const descriptions = this.getTextContentArray(
            value.join(""),
            "table > tbody > tr:nth-child(2) > td"
          ).filter((t) => t.length > 10);
          skill.name = key.replace("(元素爆発)", "");
          skill.type = "元素爆発";
          if (descriptions.length > names.length) {
            skill.description =
              `<p>${descriptions[0]}</p>` +
              names
                .map(
                  (name, index) =>
                    `<p><b>${name}:</b>${descriptions[index + 1]}</p>`
                )
                .join("");
          } else {
            skill.description = names
              .map(
                (name, index) => `<p><b>${name}:</b>${descriptions[index]}</p>`
              )
              .join("");
          }
        }
        if (key.endsWith("(移動スキル)")) {
          const names = this.getTextContentArray(value.join(""), "h4");
          const descriptions = this.getTextContentArray(
            value.join(""),
            "table > tbody > tr:nth-child(2) > td"
          ).filter((t) => t.length > 10);
          skill.name = key.replace("(移動スキル)", "");
          skill.type = "移動スキル";
          skill.description = names
            .map(
              (name, index) => `<p><b>${name}:</b>${descriptions[index]}</p>`
            )
            .join("");
        }

        skills.push(skill);
      }
    });

    return skills;
  }

  getPassives(content: Map<string, string[]>): Partial<Passive>[] {
    const passivesDom = this.createDOM(
      content.get("パッシブスキル")?.join("") || ""
    );
    const h4Content = this.parseWikiContent(passivesDom.window.document, "*", [
      "H4",
    ]);

    const passives: Partial<Passive>[] = [];

    h4Content.forEach((value, key) => {
      if (key !== "Initial") {
        const passive: Partial<Passive> = {
          name: key,
          description: this.getTextContent(
            value.join(""),
            "table > tbody > tr:nth-child(2) > td"
          ),
        };

        passives.push(passive);
      }
    });

    return passives;
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
