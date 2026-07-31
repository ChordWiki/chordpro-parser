// deno-lint-ignore-file no-explicit-any
import {
  Bars,
  BlankLine,
  Chord,
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

export function deserializeSong(serialized: any): Song {
  const lines = [];
  for (const serializedLine of serialized.lines) {
    const line = deserializeLine(serializedLine);
    if (line) lines.push(line);
  }
  return new Song(lines);
}

function deserializeLine(serialized: any) {
  switch (serialized.type) {
    case "BlankLine":
      return new BlankLine();
    case "SimpleLine":
      return new SimpleLine(serialized.text);
    case "MarkUpLine": {
      return deserializeMarkUpLine(serialized.items);
    }
    case "UnknownLine":
      return new UnknownLine(serialized.text);
    default:
      return null;
  }
}

function deserializeMarkUpLine(selialized: any) {
  const items = [];
  for (const selializedItem of selialized) {
    const item = deserializeItem(selializedItem);
    if (item) items.push(item);
  }
  return new MarkUpLine(items);
}

function deserializeItem(selialized: any) {
  switch (selialized.type) {
    case "URLTag":
      return new URLTag(selialized.url, selialized.label);
    case "Tag":
      return new Tag(selialized.name, selialized.value);
    case "Bars":
      return new Bars(selialized.text, selialized.annotation);
    case "LyricsWithChord":
      return new LyricsWithChord(
        selialized.lyrics,
        deserializeChord(selialized.chord),
      );
    case "LyricsWithAnnotation":
      return new LyricsWithAnnotation(selialized.lyrics, selialized.annotation);
    default:
      return null;
  }
}

function deserializeChord(selialized: any) {
  if (!selialized) return null;
  const { note, quality, tension, bass, paren } = selialized;
  return new Chord(
    note ? Note.parse(note) : undefined,
    quality,
    tension,
    bass ? Note.parse(bass) : undefined,
    paren,
  );
}
