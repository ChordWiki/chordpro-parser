// @deno-types="./grammar/chordpro.d.ts"
import { parse as parseGrammar, SyntaxError } from "./grammar/chordpro.js";
import { deserializeSong } from "./deserialize.ts";
import type { Song } from "./song.ts";

export { SyntaxError };

/**
 * chordpro テキストを文法どおりの CST（プレーンオブジェクト）にする。
 *
 * 回帰テストはこの戻り値をハッシュして固定する。`Song` ではなく CST を基準に
 * するのは、切り出した資産の中心が文法であり、JSON として安定に直列化できるため。
 */
// deno-lint-ignore no-explicit-any
export function parseCst(input: string): any {
  return parseGrammar(input);
}

/** chordpro テキストを `Song` にする。パースに失敗すると `SyntaxError` を投げる。 */
export function parseSong(input: string): Song {
  return deserializeSong(parseCst(input));
}
