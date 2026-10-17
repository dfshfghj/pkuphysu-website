import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkgPath = resolve(root, "node_modules/vditor/package.json");
const src = resolve(root, "node_modules/vditor/dist");

if (!existsSync(pkgPath) || !existsSync(src)) {
  console.error("[sync-vditor] 找不到 node_modules/vditor，请先安装依赖");
  process.exit(1);
}

const version = JSON.parse(readFileSync(pkgPath, "utf8")).version;
const dest = resolve(root, "public/vditor", version, "dist");
const stamp = resolve(dest, ".vditor-version");

const EXCLUDED_PATHS = ["js/mathjax"];
const excluded = new Set(EXCLUDED_PATHS.map((item) => resolve(src, item)));
const stampValue = `${version}:${EXCLUDED_PATHS.join(",")}`;

rmSync(resolve(root, "public/vditor/dist"), { recursive: true, force: true });

if (existsSync(stamp) && readFileSync(stamp, "utf8").trim() === stampValue) {
  process.exit(0);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true, filter: (from) => !excluded.has(from) });
writeFileSync(stamp, stampValue);
console.log(`[sync-vditor] 已同步 vditor ${version} 到 public/vditor/${version}/dist`);