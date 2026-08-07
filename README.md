# @chordwiki/chordpro-parser

ChordWiki の chordpro パーサ。

> [!NOTE]
> **これは ChordWiki 方言のパーサで、[chordpro.org](https://www.chordpro.org/) の参照実装とは互換ではありません。**

## 独自記法

| 記法                                             | 対応する `Line` / `Item`     |
| :----------------------------------------------- | :--------------------------- |
| `# 行末までコメント`                             | `CommentLine`                |
| `\|` `\|\|` `\|\|:` `:\|\|` の小節線             | `Bars`                       |
| `[\|]` の注釈小節線                              | `Bars`（`annotation: true`） |
| `{http(s)://〜}` `{ラベル>http(s)://〜}`         | `URLTag`                     |
| `{key:〜}` `{redirect:〜}` `{mp3:〜}` などのタグ | `Tag`                        |

`#` から行末までは丸ごとコメントで、中の `[C]` や `{title:〜}` は解釈しない。

タグ名で区別せず、`{名前:値}` と `{名前}` の形を一律に `Tag` として拾う。個々のタグの意味づけは呼び出し側で行う。

`{soc}` `{eot}` などの値なしタグの `value` は空文字になる。空値の `{title:}` は「値ありの形で値が空」として `UnknownLine` に落ちるので、両者を取り違えることはない。

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
| `test/parse_test.ts`         | 文法の単体テスト。fixture は自前の例のみで本番データは入れない         |

## 開発

```sh
deno task build   # .peggy から .js / .d.ts を再生成
deno task check   # fmt + lint + type check
deno task test    # 単体テスト
```

文法を変えたら `deno task build` を忘れないこと。CI は再生成して `git diff --exit-code` で乖離を検出する。
