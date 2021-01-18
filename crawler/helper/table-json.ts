import { JSDOM } from "jsdom";

const COLUMNS_SELECTOR = "th";
const ROWS_SELECTOR = "tr";
const CELLS_SELECTOR = "tr > td";

interface TableJsonOptions {
  columnsSelector?: string;
  rowsSelector?: string;
  cellSelector?: string;
  cellCb?: (
    cell: Element,
    index: number,
    columnName: string
  ) => void | undefined;
  [index: string]: string | any;
}

interface TableOptions {
  columnsSelector: string;
  rowsSelector: string;
  cellSelector: string;
  cellCb?: (cell: Element, index: number, columnName: string) => string;
}

const defaultToptions: TableOptions = {
  columnsSelector: COLUMNS_SELECTOR,
  rowsSelector: ROWS_SELECTOR,
  cellSelector: CELLS_SELECTOR,
};

export function tableJson(html: string, options?: TableJsonOptions) {
  let opts: TableOptions = mergeOptions(options);

  const tableDom = new JSDOM(html);

  const columns: string[] = [];
  const data: string[][] = [];

  tableDom.window.document
    .querySelectorAll(opts.columnsSelector)
    .forEach((value) => {
      columns.push(value.textContent?.trim() || "");
    });

  tableDom.window.document
    .querySelectorAll(opts.rowsSelector)
    .forEach((value) => {
      const row: string[] = [];

      value.querySelectorAll(opts.cellSelector).forEach((cell, index) => {
        if (opts.cellCb) {
          row.push(opts.cellCb(cell, index, columns[index]));
        } else {
          row.push(cell.textContent?.trim() || "");
        }
      });

      if (row.length > 0) {
        data.push(row);
      }
    });

  return {
    columns,
    data,
  };
}

function mergeOptions(options?: TableJsonOptions): TableOptions {
  let opts = defaultToptions;

  if (options) {
    Object.keys(options).forEach((key) => {
      const value = options[key];
      if (value) {
        (opts as any)[key] = value;
      }
    });
  }

  return opts;
}
