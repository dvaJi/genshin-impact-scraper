import { JSDOM } from "jsdom";

const COLUMNS_SELECTOR = "th";
const ROWS_SELECTOR = "tr";
const CELLS_SELECTOR = "tr > td";

interface TableJsonOptions {
  columnsSelector: string;
  rowsSelector: string;
  cellSelector: string;
}

export function tableJson(
  html: string,
  options: TableJsonOptions = {
    columnsSelector: COLUMNS_SELECTOR,
    rowsSelector: ROWS_SELECTOR,
    cellSelector: CELLS_SELECTOR,
  }
) {
  const tableDom = new JSDOM(html);

  const columns: string[] = [];
  const data: string[][] = [];

  tableDom.window.document
    .querySelectorAll(options.columnsSelector)
    .forEach((value) => {
      columns.push(value.textContent?.trim() || "");
    });

  tableDom.window.document
    .querySelectorAll(options.rowsSelector)
    .forEach((value) => {
      const row: string[] = [];

      value.querySelectorAll(options.cellSelector).forEach((cell) => {
        row.push(cell.textContent?.trim() || "");
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
