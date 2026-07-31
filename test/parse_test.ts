/**
 * 文法の単体テスト。CI で常に走る唯一のテスト（corpus は手元でのみ）。
 *
 * fixture は自前で書いた例のみを使う。本番の曲データは入れない。
 */
import { assertEquals } from "@std/assert";
import { parseCst, parseSong } from "../src/parse.ts";
import {
  Bars,
  BlankLine,
  Key,
  MarkUpLine,
  Note,
  SimpleLine,
} from "../src/song.ts";
import type { LyricsWithAnnotation, LyricsWithChord } from "../src/song.ts";

Deno.test("タグと歌詞", () => {
  const song = parseSong("{title:練習用}\n{key:C}\n[C]あい[G]うえ");
  assertEquals(song.tags.map((t) => [t.name, t.value]), [
    ["title", "練習用"],
    ["key", "C"],
  ]);
  const line = song.lines[2] as MarkUpLine;
  assertEquals(line.items.length, 2);
  const first = line.items[0] as LyricsWithChord;
  assertEquals(first.lyrics, "あい");
  assertEquals(`${first.chord}`, "C");
});

Deno.test("行の種類", () => {
  const song = parseSong("ただの歌詞\n\n[C]コード付き");
  assertEquals(song.lines[0] instanceof SimpleLine, true);
  assertEquals(song.lines[1] instanceof BlankLine, true);
  assertEquals(song.lines[2] instanceof MarkUpLine, true);
});

Deno.test("小節線と注釈小節線", () => {
  const line = parseSong("|[C]あ||:[G]い:||[|]").lines[0] as MarkUpLine;
  const bars = line.items.filter((i) => i instanceof Bars);
  assertEquals(bars.map((b) => [b.text, b.annotation]), [
    ["|", false],
    ["||:", false],
    [":||", false],
    ["|", true],
  ]);
});

Deno.test("注釈", () => {
  const line = parseSong("[Intro]あい").lines[0] as MarkUpLine;
  const item = line.items[0] as LyricsWithAnnotation;
  assertEquals(item.annotation, "Intro");
  assertEquals(item.lyrics, "あい");
});

Deno.test("コードの各要素", () => {
  const cases: Array<[string, string]> = [
    ["[C]", "C"],
    ["[Am7]", "Am7"],
    ["[C#m7-5]", "C#m7-5"],
    ["[G/B]", "G/B"],
    ["[GonB]", "G/B"],
    ["[C(9)]", "C(9)"],
    ["[(C)]", "(C)"],
  ];
  for (const [input, expected] of cases) {
    const line = parseSong(input).lines[0] as MarkUpLine;
    const item = line.items[0] as LyricsWithChord;
    assertEquals(`${item.chord}`, expected, input);
  }
});

Deno.test("移調（キー指定あり = ダイアトニックに寄せる）", () => {
  const song = parseSong("{key:C}\n[C]あ[F]い[G]う");
  song.transpose(2);
  const line = song.lines[1] as MarkUpLine;
  assertEquals(
    line.items.map((i) => `${(i as LyricsWithChord).chord}`),
    ["D", "G", "A"],
  );
  assertEquals(song.tags[0].value, "D (original: C)");
});

Deno.test("移調（キー指定なし = 単純な半音移動）", () => {
  const song = parseSong("[C]あ[F]い");
  song.transpose(1, "b");
  const line = song.lines[0] as MarkUpLine;
  assertEquals(
    line.items.map((i) => `${(i as LyricsWithChord).chord}`),
    ["Db", "Gb"],
  );
});

Deno.test("Note / Key", () => {
  assertEquals(`${Note.parse("Bb").transpose(2)}`, "C");
  assertEquals(`${Key.parse("Am").toMajor()}`, "C");
  assertEquals(Key.parse("Am").isMinor, true);
});

Deno.test("URL タグ", () => {
  const line = parseCst("{ChordWiki>https://example.com/x}").lines[0];
  assertEquals(line.items[0].type, "URLTag");
  assertEquals(line.items[0].label, "ChordWiki");
});

Deno.test("未知の行は UnknownLine に落ちる", () => {
  const song = parseSong("{閉じ括弧なし");
  assertEquals(song.lines[0].constructor.name, "UnknownLine");
});

Deno.test("改行の種類", () => {
  for (const nl of ["\n", "\r\n", "\r"]) {
    assertEquals(parseCst(`あ${nl}い`).lines.length, 2, JSON.stringify(nl));
  }
});

Deno.test("末尾の改行で空行が増えない", () => {
  assertEquals(parseCst("あ\n").lines.length, 1);
  assertEquals(parseCst("あ\n\n").lines.length, 2);
});
