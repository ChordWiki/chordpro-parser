Song
  = lines:Line|.., LineDelimiter| NewLine? !. { return { lines } }

NewLine "newline" = "\r\n" / "\r" / "\n"
LineDelimiter = NewLine !(!.)
NewLineOrEOF = NewLine / !.

Line
  = BlankLine &NewLineOrEOF { return { type: "BlankLine" } }
  / l:SimpleLine &NewLineOrEOF { return { type: "SimpleLine", text: l } }
  / l:MarkUpLine &NewLineOrEOF { return { type: "MarkUpLine", items: l } }
  / l:UnknownLine &NewLineOrEOF { return { type: "UnknownLine", text: l } }

_ "whitespace" = $[ \t]*

BlankLine = _
SimpleLine = $[^\n\r\[\]{}]+
MarkUpLine = Item+
UnknownLine = $[^\n\r]*

Item
  = l:URLTag { return { type: "URLTag", ...l } }
  / t:Tag { return { type: "Tag", ...t } }
  / b:Bars { return { type: "Bars", text: b } }
  / b:AnnotationBars { return { type: "Bars", text: b, annotation: true } }
  / c:LyricsWithChord { return { type: "LyricsWithChord", ...c } }
  / a:LyricsWithAnnotation { return { type: "LyricsWithAnnotation", ...a } }

URLTag = _ "{" @URLWithLabel _ "}"
URLWithLabel = label:(@$([^\n\r{}] !Schema)* ">")? u:URL { return { label, url: u } }
URL = $(Schema [^\n\r{}]+)
Schema = "http:" / "https:"

// タグ名には `comment_italic` の `_` と `mp3` の数字が入る。
// `{soc}` のような値なしタグは value を空文字にする。`{title:}` は
// 値ありの形が空なので UnknownLine のままで、両者は取り違えない。
Tag = _ "{" _ name:$[a-z0-9_]i+ _ ":" value:$[^\n\r{}]+ "}"
      { return { name: name.toLowerCase(), value } }
    / _ "{" _ name:$[a-z0-9_]i+ _ "}"
      { return { name: name.toLowerCase(), value: "" } }

Bars = RepeatLeft / RepeatRight / DoubleBar / Bar
RepeatLeft = "||:"
RepeatRight = ":||"
DoubleBar = "||"
Bar = "|"

AnnotationBars = "[" @Bars "]"

LyricChar = [^\n\r\[\]{}|:] / ":" !"||"

LyricsWithChord
  = "[" c:Chord "]" l:$LyricChar+ { return {chord: c, lyrics: l} }
  / "[" c:Chord "]" { return {chord: c} }
  / l:$LyricChar+ { return {lyrics: l} }

Chord
  = "(" e:ChordExp ")" { return { ...e, paren: true } }
  / ChordExp

ChordExp
  = n:Note q:Quality? t:Tension? b:Bass? { return { note: n, quality: q, tension: t, bass: b } }
  / b:Bass { return { bass: b } }

Note = $([A-G] Modifier?)
Modifier = "##" / "bb" / "#" / "b"
Quality = $QualityToken+
QualityToken
  = "maj" / "m" / "M" / "aug" / "dim" / "sus4" / "sus2" / "omit" / "add"
  / "#" / "+" / "b" / "-" / "3" / "5" / "6" / "7" / "9" / "11" / "13"
Tension = $("(" (TensionToken+)|.., _ "," _ | ")")
TensionToken = "+" / "#" / "-" / "b" / "3" / "5" / "6" / "9" / "11" / "13" / "add" / "omit"
Bass = On @Note
On = "/" / "on"

LyricsWithAnnotation
  = "[" a:Annotation "]" l:$LyricChar+ { return { annotation: a, lyrics: l } }
  / "[" a:Annotation "]" { return { annotation: a } }
  / l:$LyricChar+ { return { lyrics: l } }

Annotation = $AnnotationChar+
AnnotationChar = [^\n\r\[\]{}]
