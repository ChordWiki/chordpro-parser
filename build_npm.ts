/**
 * npm 形式のパッケージを `npm/` に生成する。
 *
 * このリポジトリは Deno 形式（`package.json` なし、import が `.ts` 拡張子付き）
 * なので、そのままでは npm から利用できない。dnt で `.ts` → `.js` + `.d.ts` に
 * 変換し、`package.json` を付けたものを GitHub Release に添付する。
 *
 * JSR に publish できるようになったら、この変換は JSR 側がやってくれるので
 * この仕組みごと不要になる。
 *
 *   deno run -A build_npm.ts
 */
import { build, emptyDir } from "@deno/dnt";

const denoJson = JSON.parse(await Deno.readTextFile("./deno.json"));

await emptyDir("./npm");

await build({
  entryPoints: ["./src/mod.ts"],
  outDir: "./npm",
  shims: {},
  test: false,
  scriptModule: false, // ESM のみ。CJS の利用者はいない
  package: {
    name: denoJson.name,
    version: denoJson.version,
    license: denoJson.license,
    description: "ChordWiki の chordpro パーサ（ChordWiki 方言）",
    repository: {
      type: "git",
      url: "git+https://github.com/ChordWiki/chordpro-parser.git",
    },
  },
  async postBuild() {
    await Deno.copyFile("LICENSE", "npm/LICENSE");
    await Deno.copyFile("README.md", "npm/README.md");
  },
});
