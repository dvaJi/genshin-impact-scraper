import fetch, { Request, RequestInit } from "node-fetch";
import { JSDOM } from "jsdom";
import fs from "fs-extra";
import path from "path";

const DATA_PATH = path.join(__dirname, "..", "..", "data");

export interface Crawler {
  id: symbol;
  label: string;
  isValid: boolean;
  requestOptions: RequestInit;
  run(): Promise<void>;
}

/**
 * Base class for connector plugins
 */
export abstract class Connector implements Crawler {
  id = Symbol();
  label = "";
  isValid = true;
  requestOptions = {
    method: "GET",
    redirect: "follow" as "follow",
    headers: [["accept", "image/webp,image/apng,image/*,*/*"]],
  };
  STRIP_A_TAGS = /<a.*>(.*?)<\/a>/g;
  STRIP_HEAD_TAGS = /<head.*>(.*?)<\/head>/g;
  STRIP_BODY_TAGS = /<body>(.*?)<\/body>/g;

  /**
   * Create JSDOM from the given content.
   */
  protected createDOM(content: string): JSDOM {
    return new JSDOM(content);
  }

  /**
   * Return a promise that will be resolved after the given amount of time in milliseconds
   */
  protected wait(time: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, time);
    });
  }

  /**
   * Return a promise that will be resolved after between min and max.
   */
  protected randomWait(min = 500, max = 2000): Promise<void> {
    const time = Math.floor(Math.random() * (max - min + 1)) + min;
    return this.wait(time);
  }

  protected parseWikiContent(
    document: Document,
    selector = "#mw-content-text > div > *",
    tags = ["H2", "H3"]
  ): Map<string, string[]> {
    const content = document.querySelectorAll(selector);

    const storedContent = new Map<string, string[]>();

    let latestHeader: string | null = "Initial";
    content.forEach((value) => {
      const tagName = value.tagName;
      if (tags.includes(tagName)) {
        latestHeader = value.textContent;
      } else if (latestHeader && tagName !== "ASIDE") {
        if (storedContent.has(latestHeader)) {
          storedContent.set(latestHeader, [
            ...(storedContent.get(latestHeader) || []),
            value.outerHTML,
          ]);
        } else {
          storedContent.set(latestHeader, [value.outerHTML]);
        }
      }
    });

    storedContent.delete("Navigation");
    storedContent.delete("References");

    return storedContent;
  }

  protected getInfoboxContent(
    document: Document,
    selector = "#mw-content-text > div > aside > *",
    sectionsSelector = "#mw-content-text > div > aside > section.pi-item.pi-panel.pi-border-color > div.pi-section-contents > div.pi-section-content > div"
  ): Map<string, string> {
    const storedContent = new Map();

    document.querySelectorAll(sectionsSelector).forEach((value) => {
      const key = value.querySelector("div > h3")?.textContent?.trim() || "";
      const content =
        value.querySelector("div > div")?.textContent?.trim() || "";
      storedContent.set(key, content);
    });

    const content = document.querySelectorAll(selector);

    let latestHeader: string | null = null;
    if (content) {
      content.forEach((value) => {
        if (value.hasAttribute("data-source")) {
          storedContent.set(value.getAttribute("data-source"), value.outerHTML);
        } else {
          if (value.tagName === "H2") {
            latestHeader = value.textContent;
          } else if (latestHeader) {
            if (storedContent.has(latestHeader)) {
              storedContent.set(latestHeader, [
                ...storedContent.get(latestHeader),
                value.outerHTML,
              ]);
            } else {
              storedContent.set(latestHeader, [value.outerHTML]);
            }
          }
        }
      });
    }

    return storedContent;
  }

  protected parseTableLinks(content: string, selector: string): string[] {
    const weaponsLinks: string[] = [];

    const tableSection = this.createDOM(content);

    tableSection.window.document.querySelectorAll(selector).forEach((value) => {
      weaponsLinks.push(value.getAttribute("href") || "");
    });

    return weaponsLinks.filter((l) => l !== "");
  }

  protected getTextContent(
    content: string | Document,
    selector: string
  ): string {
    let dom = null;

    if (typeof content === "string") {
      dom = this.createDOM(content).window.document;
    } else {
      dom = content;
    }

    return dom.querySelector(selector)?.textContent?.trim() || "";
  }

  protected getHtmlContent(
    content: string | Document,
    selector: string
  ): string {
    let dom = null;

    if (typeof content === "string") {
      dom = this.createDOM(content).window.document;
    } else {
      dom = content;
    }

    return dom.querySelector(selector)?.innerHTML?.trim() || "";
  }

  protected getTextContentArray(
    content: string | Document,
    selector: string
  ): string[] {
    let dom = null;

    if (typeof content === "string") {
      dom = this.createDOM(content).window.document;
    } else {
      dom = content;
    }

    const values: string[] = [];

    dom.querySelectorAll(selector).forEach((value) => {
      values.push(value.textContent?.trim() || "");
    });

    return values;
  }

  protected stripHtml(data: string, regex: RegExp | RegExp[]): string {
    try {
      if (regex instanceof RegExp) {
        return data.replace(regex, "$1");
      } else {
        let value = "";
        for (const rgx of regex) {
          value = data.replace(rgx, "$1");
          console.log(value, rgx);
        }
        return value;
      }
    } catch (err) {
      return data;
    }
  }

  /**
   * Get the content for the given Request.
   */
  protected async fetchDOM(request: Request, retries = 0): Promise<JSDOM> {
    if (typeof request === "string") {
      request = new Request(request, this.requestOptions);
    }
    if (request instanceof URL) {
      request = new Request(request.href, this.requestOptions);
    }
    console.debug(request);
    const response = await fetch(request);
    if (response.status >= 500 && retries > 0) {
      return this.wait(2500).then(() => this.fetchDOM(request, retries - 1));
    }
    if (response.status === 200) {
      return response.text().then((data: string) => {
        const dom = this.randomWait(100, 2000).then(() => this.createDOM(data));
        return Promise.resolve(dom);
      });
    }
    throw new Error(
      `Failed to receive content from "${request.url}" (status: ${response.status}) - ${response.statusText}`
    );
  }

  async run(): Promise<void> {
    console.log(`Init crawl ${this.id.toString()}`);
    await this.crawl();
    console.log(`Crawl ${this.id.toString()} has finished.`);
  }

  protected abstract crawl(): Promise<void>;

  protected saveFile(data: string, directory: string, filename: string): void {
    const filePath = `${DATA_PATH}${directory}${filename}.json`;

    try {
      fs.ensureDirSync(path.dirname(filePath));
      fs.writeFileSync(filePath, data);
    } catch (err) {
      console.error(err);
    }
  }

  protected slugify(value: string): string {
    if (!value) return "";

    return value
      .toLowerCase()
      .replace(/\s/g, "_")
      .replace(/\W/g, "")
      .replace(/__+/g, "_");
  }
}
