import fetch, { Request, RequestInit } from "node-fetch";
import { JSDOM } from "jsdom";
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(__dirname, "..", "..", "data");

export interface Crawler {
  id: symbol;
  label: string;
  isValid: boolean;
  requestOptions: RequestInit;
  createDOM(content: string): JSDOM;
  fetchDOM(request: Request, retries: number): Promise<JSDOM>;
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

  /**
   * Create CheerioStatic from the given content.
   */
  createDOM(content: string): JSDOM {
    return new JSDOM(content);
  }

  /**
   * Return a promise that will be resolved after the given amount of time in milliseconds
   */
  wait(time: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, time);
    });
  }

  /**
   * Return a promise that will be resolved after between min and max.
   */
  randomWait(min = 500, max = 2000): Promise<void> {
    const time = Math.floor(Math.random() * (max - min + 1)) + min;
    return this.wait(time);
  }

  parseWikiContent(
    document: Document,
    selector = "#mw-content-text > div > *"
  ): Map<string, string> {
    const content = document.querySelectorAll(selector);

    const storedContent = new Map();

    let latestHeader: string | null = null;
    content.forEach((value) => {
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
    });

    return storedContent;
  }

  getInfoboxContent(
    document: Document,
    selector = "#mw-content-text > div > aside > *"
  ): Map<string, string> {
    const storedContent = new Map();

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

  /**
   * Get the content for the given Request.
   */
  async fetchDOM(request: Request, retries = 0): Promise<JSDOM> {
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
    this.crawl();
    console.log(`Crawl ${this.id.toString()} has finished.`);
  }

  protected abstract crawl(): any;

  protected saveFile(data: string, path: string, filename: string) {
    fs.writeFile(`${DATA_PATH}${path}${filename}.json`, data, (err) => {
      if (err) {
        console.error(err);
      }
    });
  }

  slugify(value: string) {
    if (!value) return "";

    return value
      .toLowerCase()
      .replace(/\s/g, "_")
      .replace(/\W/g, "")
      .replace(/\__+/g, "_");
  }
}
