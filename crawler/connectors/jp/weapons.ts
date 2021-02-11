import { Request } from "node-fetch";
import { Connector } from "@engine/Connector";
import { Weapon } from "@engine/Types";
import { tableJson } from "@helper/table-json";

export default class CharactersCrawler extends Connector {
  BASE_URL = "https://gamewith.jp";
  selectors = {
    urls: "table > tbody > tr > td:nth-child(1) > a",
    name:
      "body > div.page-wrap > div > div.main-wrap > div.main-col-wrap > div.c-box.w-for-tips-custom-style > div.article-hero > div.article-top.in-article > div.flex-box > h1 > span._main",
    description: "table > tbody > tr:nth-child(2) > td",
    bonus: "table > tbody > tr:nth-child(1) > th",
  };

  constructor() {
    super();
    super.id = Symbol("jap_weapons");
    super.label = "jap_weapons";
  }

  protected async crawl(): Promise<void> {
    const request = new Request(
      `${this.BASE_URL}/genshin/article/show/231778`,
      this.requestOptions
    );
    const dom = await this.fetchDOM(request);
    const storedContent = this.parseWikiContent(
      dom.window.document,
      "#article-body > *"
    );

    // Sword
    await this.generateWeapons(
      storedContent.get(`片手剣`)?.join() || "",
      "sword"
    );

    // Claymore
    await this.generateWeapons(
      storedContent.get(`両手剣`)?.join() || "",
      "claymore"
    );

    // Polearm
    await this.generateWeapons(
      storedContent.get(`長柄武器(槍)`)?.join() || "",
      "polearm"
    );

    // Catalyst
    await this.generateWeapons(
      storedContent.get(`法器`)?.join() || "",
      "catalyst"
    );

    //Bow
    await this.generateWeapons(
      storedContent.get(`弓`)?.join() || "",
      "catalyst"
    );
  }

  async generateWeapons(content: string, weaponType: string): Promise<void> {
    const weaponsTable = tableJson(content);
    for await (const value of weaponsTable.data) {
      const [name, info] = value;

      const weapon: Partial<Weapon> = {
        id: name,
        name,
        bonus: info.replace(/【\W*】/g, ""),
      };

      this.saveFile(
        JSON.stringify(weapon, undefined, 2),
        "/jp/weapons/",
        `${weaponType}_${name}`
      );
    }
  }
}
