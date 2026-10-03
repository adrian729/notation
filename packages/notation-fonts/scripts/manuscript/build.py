"""Build an editable, reproducible source font; font:add owns shipped outputs."""

import hashlib
import json
import sys
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.recordingPen import DecomposingRecordingPen, RecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

from outlines import combine, drawings, transform
from pen import STEM_PROFILE, BEAM_PROFILE

ROOT = Path(__file__).resolve().parents[2]
TEXTURINA_SHA = "478a15d7145cf94565cfc1aeb33596aeb0118c7d86a84d061ddf46de3d7dfda3"


def bounds(drawing):
    pen = BoundsPen(None)
    drawing.replay(pen)
    return pen.bounds or (0, 0, 0, 0)


def main():
    glyphs = json.loads(Path(sys.argv[1]).read_text())
    out = ROOT / "out/manuscript-source"
    out.mkdir(parents=True, exist_ok=True)
    source = ROOT / "vendor/texturina/Texturina[opsz,wght].ttf"
    if hashlib.sha256(source.read_bytes()).hexdigest() != TEXTURINA_SHA:
        raise ValueError("Texturina differs from the pinned source; see scripts/manuscript/README.md")
    text = instantiateVariableFont(TTFont(source, recalcTimestamp=False), {"opsz": 24, "wght": 500})
    text_glyphs = text.getGlyphSet()
    cmap = text.getBestCmap()
    masters = drawings()

    def lettering(value, height=1.8, centered=False):
        pen = RecordingPen()
        x = 0
        for char in value:
            name = cmap[ord(char)]
            outline = DecomposingRecordingPen(text_glyphs)
            text_glyphs[name].draw(outline)
            outline.replay(TransformPen(pen, (1, 0, 0, 1, x, 0)))
            x += text["hmtx"][name][0]
        x0, y0, x1, y1 = bounds(pen)
        # A common cap height preserves Texturina's letter proportions,
        # descenders, numeral overshoots and baseline across all words.
        cap = text["OS/2"].sCapHeight
        scale = height / cap
        return transform(pen, sx=scale, sy=scale, dx=-x0 * scale, dy=-height / 2 if centered else 0)

    for i in range(10):
        masters["timeSig" + str(i)] = lettering(str(i), 2, True)
        masters["tuplet" + str(i)] = lettering(str(i), 0.95)
        if i in (1, 2, 3, 4):
            masters["mensuralProportion" + str(i)] = lettering(str(i), 2, True)
    masters["tupletColon"] = lettering(":", 0.95)
    dynamics = {
        "Piano": "p",
        "Mezzo": "m",
        "Forte": "f",
        "Rinforzando": "r",
        "Sforzando": "s",
        "Z": "z",
        "Niente": "n",
        "PPPPPP": "pppppp",
        "PPPPP": "ppppp",
        "PPPP": "pppp",
        "PPP": "ppp",
        "PP": "pp",
        "MP": "mp",
        "MF": "mf",
        "PF": "pf",
        "FF": "ff",
        "FFF": "fff",
        "FFFF": "ffff",
        "FFFFF": "fffff",
        "FFFFFF": "ffffff",
        "FortePiano": "fp",
        "Forzando": "fz",
        "Sforzando1": "sf",
        "SforzandoPiano": "sfp",
        "SforzandoPianissimo": "sfpp",
        "Sforzato": "sfz",
        "SforzatoPiano": "sfzp",
        "SforzatoFF": "sffz",
        "Rinforzando1": "rf",
        "Rinforzando2": "rfz",
    }
    for name, value in dynamics.items():
        masters["dynamic" + name] = lettering(value, 1.65)
    for clef, x, above, below in [("gClef", 0.97, 3.06, -2.13), ("fClef", 0.56, 1.44, -2.03)]:
        for suffix, y in [("8va", above), ("8vb", below)]:
            masters[clef + suffix] = combine(masters[clef], transform(lettering("8", 0.82), dx=x, dy=y))

    missing = set(glyphs) - set(masters)
    if missing:
        raise ValueError(f"Undrawn glyphs: {sorted(missing)}")
    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder([".notdef", *glyphs])
    fb.setupCharacterMap({cp: name for name, cp in glyphs.items()})
    outlines = {}
    metrics = {}
    for name in [".notdef", *glyphs]:
        drawing = masters.get(name, RecordingPen())
        # Glyph origins stay fixed: the staff pitch / clef reference line is y=0.
        pen = TTGlyphPen(None)
        drawing.replay(TransformPen(Cu2QuPen(pen, 0.4), (250, 0, 0, 250, 0, 0)))
        outlines[name] = pen.glyph()
        x0, y0, x1, y1 = bounds(drawing)
        advance = max(x1, 0.1)
        metrics[name] = (round(advance * 250), round(x0 * 250))
    fb.setupGlyf(outlines)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=1500, descent=-1500)
    fb.setupNameTable(
        {
            "familyName": "PolyhymniaManuscript",
            "styleName": "Regular",
            "uniqueFontIdentifier": "PolyhymniaManuscript 1.000",
            "fullName": "PolyhymniaManuscript",
            "psName": "PolyhymniaManuscript",
            "version": "Version 1.000",
            "copyright": "Copyright 2026 Polyhymnia contributors. Lettering: Copyright 2020 The Texturina Project Authors.",
            "licenseDescription": "SIL Open Font License, Version 1.1",
            "licenseInfoURL": "https://openfontlicense.org/",
        }
    )
    fb.setupOS2(sTypoAscender=1500, sTypoDescender=-1500, usWinAscent=1500, usWinDescent=1500)
    fb.setupPost()
    fb.font["head"].created = fb.font["head"].modified = 3873830400
    fb.font.recalcTimestamp = False
    fb.save(out / "PolyhymniaManuscript.ttf")
    # Bounds must come from the rounded compiled font, not the drawing's
    # control points. font:add measures them and retains these explicit anchors.
    defaults = json.loads((ROOT / "fonts/polyhymnia-mensural/metadata.json").read_text())["engravingDefaults"]
    defaults.update(
        staffLineThickness=0.10,
        stemThickness=0.14,
        legerLineThickness=0.13,
        thinBarlineThickness=0.13,
        thickBarlineThickness=0.36,
        dashedBarlineThickness=0.13,
        beamThickness=0.43,
        textFontFamily=["Texturina"],
        strokeVariation=0.022,
        strokeWander=0.18,
        stemStroke=dict(profile=STEM_PROFILE, wander=0.025),
        beamStroke=dict(profile=BEAM_PROFILE, wander=0.025),
    )
    anchors = {}
    for name in ["noteheadBlack", "noteheadHalf"]:
        anchors[name] = {"stemUpSE": [1.24, -0.02], "stemDownNW": [0.06, 0.02]}
    for name in ["mensuralNoteheadMinimaWhite", "mensuralNoteheadSemiminimaWhite"]:
        anchors[name] = {"stemUpSE": [0.71, 0.46], "stemDownNW": [0.59, -0.46]}
    for name in glyphs:
        if name.startswith("flag"):
            anchors[name] = {"stemDownNW" if name.endswith("Down") else "stemUpSE": [0, 0]}
    metadata = {
        "fontName": "PolyhymniaManuscript",
        "fontVersion": 1,
        "engravingDefaults": defaults,
        "glyphsWithAnchors": anchors,
    }
    (out / "metadata.json").write_text(json.dumps(metadata))
    licence = (ROOT / "vendor/texturina/OFL.txt").read_text()
    (out / "OFL.txt").write_text(
        "Copyright 2026 Polyhymnia contributors (manuscript music outlines).\n" + licence
    )
    print(f"Built {len(glyphs)} manuscript drawings into {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
