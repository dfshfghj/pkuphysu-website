export interface SurveyResponseTable {
  headers: string[];
  rows: string[][];
}

// Read the server export without losing quoted newlines, commas or empty answers.
export const parseSurveyResponsesCsv = (input: string): SurveyResponseTable => {
  const source = input.replace(/^\uFEFF/, "");
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  let closedQuote = false;
  const finishField = () => {
    record.push(field);
    field = "";
    closedQuote = false;
  };
  const finishRecord = () => {
    finishField();
    if (record.length > 1 || record[0] !== "") records.push(record);
    record = [];
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          closedQuote = true;
        }
      } else {
        field += character;
      }
    } else if (character === ",") {
      finishField();
    } else if (character === "\n" || character === "\r") {
      finishRecord();
      if (character === "\r" && source[index + 1] === "\n") index += 1;
    } else if (character === '"' && field === "" && !closedQuote) {
      quoted = true;
    } else {
      if (closedQuote || character === '"') throw new Error("答卷文件格式不正确");
      field += character;
    }
  }
  if (quoted) throw new Error("答卷文件格式不正确");
  if (field !== "" || record.length > 0 || closedQuote) finishRecord();
  const [headers = [], ...rows] = records;
  if (rows.some((row) => row.length !== headers.length)) throw new Error("答卷文件列数不一致");
  return { headers, rows };
};
