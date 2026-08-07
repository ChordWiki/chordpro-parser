/**
 * ChordWiki の chordpro パーサ。
 *
 * ChordWiki 独自記法（`|` `||:` `:||` の小節線、`[|]` の注釈小節線、
 * `{label>url}` の URL タグ、`#` のコメント行）を含む方言を扱う。
 * chordpro.org の参照実装とは互換でない。
 *
 * レンダリングは含めない（ADR 0004）。DOM / JSX に依存させないこと。
 */
export { parseCst, parseSong, SyntaxError } from "./parse.ts";
export { deserializeSong } from "./deserialize.ts";
export {
  Bars,
  BlankLine,
  Chord,
  CommentLine,
  Key,
  LyricsWithAnnotation,
  LyricsWithChord,
  MarkUpLine,
  Note,
  SimpleLine,
  Song,
  Tag,
  UnknownLine,
  URLTag,
} from "./song.ts";
export { songMeta } from "./song.ts";
export type { Item, Line } from "./song.ts";
