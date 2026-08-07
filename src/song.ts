/**
 * オブジェクトのキーと値を入れ替える。`@std/collections` の `invert` 相当。
 */
function invert<T extends Record<PropertyKey, PropertyKey>>(
  record: T,
): { [K in keyof T as T[K]]: K } {
  const result = {} as Record<PropertyKey, PropertyKey>;
  for (const [key, value] of Object.entries(record)) {
    result[value] = key;
  }
  return result as { [K in keyof T as T[K]]: K };
}

export class Song {
  lines: Line[];
  constructor(lines?: Line[]) {
    this.lines = lines?.slice() ?? [];
  }
  get tags(): Tag[] {
    return this.lines
      .filter((l) => l instanceof MarkUpLine)
      .flatMap((l) => l.items.filter((i) => i instanceof Tag));
  }
  transpose(d: number, preferModifier: Modifier = "") {
    let currentKey: null | Key = null;
    let transposed: null | Key = null;
    this.lines.forEach((line) => {
      if (line instanceof MarkUpLine) {
        line.items.forEach((item) => {
          if (item instanceof Tag && item.name === "key") {
            currentKey = Key.parse(item.value);
            transposed = currentKey.transpose(d, preferModifier);
            if (!currentKey.equal(transposed)) {
              item.value = `${transposed} (original: ${currentKey})`;
            }
          }
          if (item instanceof LyricsWithChord) {
            if (item.chord) {
              if (currentKey && transposed) {
                item.chord = item.chord.keyChange(currentKey, transposed);
              } else {
                item.chord = item.chord.transpose(d, preferModifier);
              }
            }
          }
        });
      }
    });
  }
}

/**
 * 見出しに使うタイトルと副題。同じ意味の短縮形と正式名の両方が使われるので、
 * どちらでも拾う。同じタグが複数あれば後のものが勝つ。
 */
export function songMeta(song: Song): { title: string; subtitle: string } {
  let title = "";
  let subtitle = "";
  for (const tag of song.tags) {
    if (tag.name === "t" || tag.name === "title") title = tag.value;
    if (tag.name === "st" || tag.name === "subtitle") subtitle = tag.value;
  }
  return { title, subtitle };
}

export type Line =
  | BlankLine
  | CommentLine
  | SimpleLine
  | MarkUpLine
  | UnknownLine;

export class BlankLine {}

/** `#` で始まる行。表示されないコメント。`text` は `#` より後ろ。 */
export class CommentLine {
  text: string;
  constructor(text: string) {
    this.text = text;
  }
}

export class SimpleLine {
  text: string;
  constructor(text: string) {
    this.text = text;
  }
}

export class MarkUpLine {
  items: Item[];
  constructor(items?: Item[]) {
    this.items = items?.slice() ?? [];
  }
}

export class UnknownLine {
  text: string;
  constructor(text: string) {
    this.text = text;
  }
}

export type Item = URLTag | Tag | Bars | LyricsWithChord | LyricsWithAnnotation;

export class URLTag {
  url: string;
  label?: string;
  constructor(url: string, label?: string | null) {
    this.url = url;
    if (label) this.label = label;
  }
}

export class Tag {
  name: string;
  value: string;
  constructor(name: string, value: string) {
    this.name = name;
    this.value = value;
  }
}

export class Bars {
  text: string;
  annotation: boolean;
  constructor(text: string, annotation = false) {
    this.text = text;
    this.annotation = !!annotation;
  }
}

export class LyricsWithChord {
  chord?: Chord;
  lyrics?: string;
  constructor(lyrics?: string, chord?: Chord | null) {
    this.lyrics = lyrics;
    if (chord) this.chord = chord;
  }
}

export class LyricsWithAnnotation {
  annotation?: string;
  lyrics?: string;
  constructor(lyrics?: string, annotation?: string) {
    this.lyrics = lyrics;
    this.annotation = annotation;
  }
}

const baseNoteInST = { A: 0, B: 2, C: 3, D: 5, E: 7, F: 8, G: 10 } as const;
const baseNoteInOct = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6 } as const;
type BaseNote = keyof typeof baseNoteInST;
const modifierNumber = { "bb": -2, "b": -1, "": 0, "#": 1, "##": 2 } as const;
type Modifier = keyof typeof modifierNumber;
const modifierOfKey = {
  A: { A: 0, B: 0, C: 1, D: 0, E: 0, F: 1, G: 1 },
  B: { A: 1, B: 0, C: 1, D: 1, E: 0, F: 1, G: 1 },
  C: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0 },
  D: { A: 0, B: 0, C: 1, D: 0, E: 0, F: 1, G: 0 },
  E: { A: 0, B: 0, C: 1, D: 1, E: 0, F: 1, G: 1 },
  F: { A: 0, B: -1, C: 0, D: 0, E: 0, F: 0, G: 0 },
  G: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 1, G: 0 },
};
type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const baseNoteInvert = invert(baseNoteInST);
const noteFromST = {
  "": { 1: "Bb", 4: "C#", 6: "Eb", 9: "F#", 11: "Ab", ...baseNoteInvert },
  "b": { 1: "Bb", 4: "Db", 6: "Eb", 9: "Gb", 11: "Ab", ...baseNoteInvert },
  "#": { 1: "A#", 4: "C#", 6: "D#", 9: "F#", 11: "G#", ...baseNoteInvert },
};
function normalizeST(n: number) {
  type SemiTone = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
  return ((Math.floor(n) % 12) + 12) % 12 as SemiTone;
}
const baseNoteInOctInvert = invert(baseNoteInOct);
function normalizeOct(n: number) {
  return ((Math.floor(n) % 7) + 7) % 7 as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}
function baseNoteFromOct(n: number) {
  const normalized = normalizeOct(n);
  return baseNoteInOctInvert[normalized];
}
const modifierNumberInvert = invert(modifierNumber);
function modifierFrom(n: number) {
  if (n < -2 || 2 < n) throw new Error("invalid modifier num:" + n);
  const num = n as keyof typeof modifierNumberInvert;
  return modifierNumberInvert[num];
}

export class Note {
  baseNote: BaseNote;
  modifier: Modifier;
  constructor(baseNote: BaseNote, modifier: Modifier) {
    this.baseNote = baseNote;
    this.modifier = modifier;
  }
  static parse(s: string): Note {
    const baseNote = s[0] as BaseNote;
    if (!Object.keys(baseNoteInST).includes(baseNote)) {
      throw new Error("invalid baseNote:" + baseNote);
    }
    const modifier = s.slice(1) as Modifier;
    if (!Object.keys(modifierNumber).includes(modifier)) {
      throw new Error("invalid modifier:" + modifier);
    }
    return new Note(baseNote, modifier);
  }
  toString(): string {
    return this.baseNote + this.modifier;
  }
  equal(other: Note): boolean {
    return this.baseNote === other.baseNote && this.modifier === other.modifier;
  }
  transpose(d: number, preferModifier: Modifier = ""): Note {
    return Note.fromST(this.toST() + d, preferModifier);
  }
  keyChange(from: Key, to: Key): Note {
    const noteFrom = from.toMajor().note;
    const noteTo = to.toMajor().note;
    const [nTarget, nFrom, nTo] = [this, noteFrom, noteTo].map((note) => (
      { b: baseNoteInOct[note.baseNote], m: modifierNumber[note.modifier] }
    ));
    const baseNum = nTarget.b + nTo.b - nFrom.b;
    const base = baseNoteFromOct(baseNum);
    const offsetTo = modifierOfKey[noteTo.baseNote][base];
    const offsetFrom = modifierOfKey[noteFrom.baseNote][this.baseNote];
    const modifierNum = nTarget.m + (nTo.m + offsetTo) - (nFrom.m + offsetFrom);
    const modifier = modifierFrom(modifierNum);
    return new Note(base, modifier);
  }
  toST(): number {
    const n = baseNoteInST[this.baseNote] + modifierNumber[this.modifier];
    return normalizeST(n);
  }
  static fromST(n: number, preferModifier: Modifier = ""): Note {
    const normalized = normalizeST(n);
    const p = preferModifier;
    if (p == "bb" || p == "##") {
      throw new Error("unimplemented preferModifier: " + p);
    }
    return this.parse(noteFromST[p][normalized]);
  }
  diatonic(degree: Degree, modifier: Modifier): Note {
    const b = baseNoteInOct[this.baseNote];
    const m = modifierNumber[this.modifier];
    const targetNote = baseNoteFromOct(b + degree - 1);
    const offset = modifierOfKey[this.baseNote][targetNote];
    const modifierNum = m + modifierNumber[modifier] + offset;
    const targetMod = modifierFrom(modifierNum);
    return new Note(targetNote, targetMod);
  }
}

export class Key {
  note: Note;
  isMinor: boolean;
  constructor(note: Note, isMinor = false) {
    this.note = note;
    this.isMinor = isMinor;
  }
  static parse(s: string): Key {
    const minorRegex = /m$/;
    const isMinor = minorRegex.test(s);
    if (isMinor) s = s.replace(minorRegex, "");
    const note = Note.parse(s);
    return new Key(note, isMinor);
  }
  toString(): string {
    const suffix = this.isMinor ? "m" : "";
    return `${this.note}${suffix}`;
  }
  transpose(d: number, preferModifier?: Modifier): Key {
    return new Key(this.note.transpose(d, preferModifier), this.isMinor);
  }
  toMajor(): Key {
    if (!this.isMinor) return this;
    const note = this.note.diatonic(3, "b");
    return new Key(note, false);
  }
  equal(other: Key): boolean {
    return this.note.equal(other.note) && this.isMinor === other.isMinor;
  }
}

export class Chord {
  note?: Note;
  quality?: string;
  tension?: string;
  bass?: Note;
  paren = false;
  constructor(
    note?: Note,
    quality?: string,
    tension?: string,
    bass?: Note,
    paren?: boolean,
  ) {
    if (note) this.note = note;
    if (quality) this.quality = quality;
    if (tension) this.tension = tension;
    if (bass) this.bass = bass;
    if (paren) this.paren = true;
  }
  toString(): string {
    const { note, quality, tension, bass, paren } = this;
    return [
      paren && "(",
      note && `${note}`,
      quality,
      tension,
      bass && `/${bass}`,
      paren && ")",
    ].filter(Boolean).join("");
  }
  mapNote(f: (c?: Note) => Note | undefined): Chord {
    const { note, quality, tension, bass, paren } = this;
    return new Chord(f(note), quality, tension, f(bass), paren);
  }
  transpose(d: number, preferModifier: Modifier = ""): Chord {
    return this.mapNote((c) => c?.transpose(d, preferModifier));
  }
  keyChange(from: Key, to: Key): Chord {
    return this.mapNote((c) => c?.keyChange(from, to));
  }
}
