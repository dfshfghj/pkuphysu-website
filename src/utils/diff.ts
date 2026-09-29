export interface DiffLine {
  type: "same" | "add" | "del";
  text: string;
}

// 超过这个规模就不用 LCS 表，避免长文把内存吃满
const MAX_CELLS = 1_000_000;

const splitLines = (text: string) => (text === "" ? [] : text.replace(/\r\n/g, "\n").split("\n"));

export const lineDiff = (oldText: string, newText: string): DiffLine[] => {
  const a = splitLines(oldText);
  const b = splitLines(newText);

  if (a.length * b.length > MAX_CELLS) {
    const lines: DiffLine[] = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] === b[i]) {
        lines.push({ type: "same", text: a[i] ?? "" });
        continue;
      }
      if (a[i] !== undefined) lines.push({ type: "del", text: a[i] });
      if (b[i] !== undefined) lines.push({ type: "add", text: b[i] });
    }
    return lines;
  }

  const n = a.length;
  const m = b.length;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      result.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      result.push({ type: "del", text: a[i] });
      i++;
    } else {
      result.push({ type: "add", text: b[j] });
      j++;
    }
  }
  while (i < n) {
    result.push({ type: "del", text: a[i++] });
  }
  while (j < m) {
    result.push({ type: "add", text: b[j++] });
  }
  return result;
};

export const diffStats = (lines: DiffLine[]) => ({
  added: lines.filter((line) => line.type === "add").length,
  removed: lines.filter((line) => line.type === "del").length,
});
