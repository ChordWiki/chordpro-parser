# @chordwiki/chordpro-parser

ChordWiki の chordpro パーサ。

> **これは ChordWiki 方言のパーサで、[chordpro.org](https://www.chordpro.org/) の参照実装とは互換ではありません。** ChordWiki 独自記法として `|` `||:` `:||` の小節線、`[|]` の注釈小節線、`{label>url}` の URL タグを含みます。

## 使用例

```ts
import { parseSong } from "@chordwiki/chordpro-parser";

const song = parseSong("{title:練習用}\n{key:C}\n[C]あい[G]うえ");
song.transpose(2); // 移調（{key:} があればダイアトニックに寄せる）
```

## 構成

| パス                         | 役割                                                                   |
| :--------------------------- | :--------------------------------------------------------------------- |
| `src/grammar/chordpro.peggy` | 文法定義。**資産の中心**                                               |
| `src/grammar/chordpro.js`    | peggy の生成物。手元で build して**commit する**                       |
| `src/grammar/chordpro.d.ts`  | `peggy --dts` の生成物。戻り値は `any` なので型は呼び出し側で付ける    |
| `src/song.ts`                | `Song` / `Line` / `Item` / `Note` / `Key` / `Chord` と移調、`songMeta` |
| `src/deserialize.ts`         | CST → `Song`                                                           |

## 開発

```sh
deno task build   # .peggy から .js / .d.ts を再生成
deno task check   # fmt + lint + type check
deno task test    # 単体テスト
```

文法を変えたら `deno task build` を忘れないこと。CI は再生成して `git diff --exit-code` で乖離を検出する。
