/**
 * npm 形式のパッケージを `npm/` に生成する。ローカル検証用。
 *
 * このリポジトリは Deno 形式（`package.json` なし、import が `.ts` 拡張子付き）
 * なので、そのままでは npm のプロジェクトから利用できない。dnt で
 * `.ts` → `.js` + `.d.ts` に変換し、`package.json` を付けたものを作る。
 *
 * webui など npm 側の利用者から、publish 前の変更を試すために使う:
 *
 *   deno task build:npm
 *   cd ../webui && npm install --no-save file:../chordpro-parser/npm
 *
 * 出力は JSR の npm 互換ビルドと同一ではないので、これで見られるのは
 * 「利用側のコードが新しい API で動くか」まで。JSR 配信そのものの検査は
 * `deno publish --dry-run` が担当する。
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
