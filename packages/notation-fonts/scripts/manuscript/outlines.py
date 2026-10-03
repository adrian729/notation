"""Manuscript master drawings, in staff spaces, y upwards.

The G clef follows the later illuminated manuscript; the lozenges follow the
first reference, and the F clef follows the third reference and its close crop.
These are outline drawings, not a raster effect applied to an engraved font.
"""

import math

from pen import STEM_PROFILE

from fontTools.pens.basePen import BasePen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.reverseContourPen import ReverseContourPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path


def path(d):
    pen = RecordingPen()
    parse_path(d, pen)
    return pen


def combine(*drawings):
    pen = RecordingPen()
    for drawing in drawings:
        drawing.replay(pen)
    return pen


def transform(drawing, sx=1, sy=1, dx=0, dy=0):
    pen = RecordingPen()
    # A reflection must not turn black ink into an opposite-winding counter
    # when it is subsequently composed with a stem or a cut-time stroke.
    target = ReverseContourPen(pen) if sx * sy < 0 else pen
    drawing.replay(TransformPen(target, (sx, 0, 0, sy, dx, dy)))
    return pen


def reverse(drawing):
    pen = RecordingPen()
    drawing.replay(ReverseContourPen(pen))
    return pen


class Trace(BasePen):
    """Sample pen trajectories, keeping the original curves as the master."""

    def __init__(self):
        super().__init__(None)
        self.lines = []

    def _moveTo(self, p):
        self.lines.append([p])

    def _lineTo(self, p):
        start = self.lines[-1][-1]
        n = max(1, math.ceil(math.dist(start, p) / 0.09))
        self.lines[-1].extend(tuple(a + (b - a) * i / n for a, b in zip(start, p)) for i in range(1, n + 1))

    def _curveToOne(self, a, b, c):
        p = self.lines[-1][-1]
        n = max(4, math.ceil((math.dist(p, a) + math.dist(a, b) + math.dist(b, c)) / 0.09))
        for i in range(1, n + 1):
            t = i / n
            self.lines[-1].append(
                tuple(
                    (1 - t) ** 3 * p[k]
                    + 3 * (1 - t) ** 2 * t * a[k]
                    + 3 * (1 - t) * t * t * b[k]
                    + t**3 * c[k]
                    for k in (0, 1)
                )
            )

    def _closePath(self):
        self._lineTo(self.lines[-1][0])

    def _endPath(self):
        pass


def stroke(d, width=0.16, nib=0.7, taper=0.35):
    """A pressure-varying broad-nib stroke; no random state or raster tracing."""
    trace = Trace()
    parse_path(d, trace)
    pen = RecordingPen()
    for points in trace.lines:
        left, right = [], []
        for i, (x, y) in enumerate(points):
            a, b = points[max(0, i - 1)], points[min(len(points) - 1, i + 1)]
            vx, vy = b[0] - a[0], b[1] - a[1]
            length = math.hypot(vx, vy) or 1
            nx, ny = -vy / length, vx / length
            angle = math.atan2(vy, vx)
            t = i / (len(points) - 1)
            pressure = 1 - taper * abs(2 * t - 1) ** 8
            breadth = width * (0.32 + 0.68 * abs(math.sin(angle + nib))) * pressure
            breadth *= 1 + 0.055 * math.sin(t * 17 + len(points)) + 0.035 * math.sin(t * 41)
            left.append((x + nx * breadth / 2, y + ny * breadth / 2))
            right.append((x - nx * breadth / 2, y - ny * breadth / 2))
        pen.moveTo(left[0])
        for p in left[1:] + right[::-1]:
            pen.lineTo(p)
        pen.closePath()
    return pen


# Unequal shoulders and a slightly rounded pen entry. Keep both vertices on
# the centre axis, with enough ink around them to receive the centred stems.
LOZENGE = path(
    "M 0 -.018 C .115 .12 .34 .31 .65 .53 C .73 .445 .77 .385 .85 .323 L 1.30 -.028 C 1.145 -.13 .91 -.342 .65 -.52 C .56 -.43 .49 -.373 .383 -.306 C .211 -.22 .09 -.131 0 -.018 Z"
)
COUNTER = path(
    "M .20 .05 C .41 -.09 .69 -.29 .90 -.34 L 1.12 -.045 C .91 .096 .62 .272 .41 .337 C .32 .235 .25 .14 .20 .05 Z"
)
WHITE = combine(LOZENGE, COUNTER)
DOT = path("M 0 -.015 L .14 .15 Q .21 .045 .30 -.01 L .14 -.16 Z")

# Later illuminated reference, upper-left clefs: rounded, open Gothic bowl,
# pointed inner tongue, angular crown and short upturned quill terminal.
# The bowl surrounds the G line (y=0); the crown fits below the top staff line.
G_CLEF = combine(
    reverse(
        path(
            "M .98 1.79 C .61 1.64 .22 1.10 .10 .55 C -.05 -.07 .20 -.69 .83 -.96 C 1.34 -1.16 1.91 -.69 2.10 -.27 C 1.78 -.61 1.55 -.78 1.15 -.61 C .72 -.43 .43 -.02 .37 .47 C .31 .97 .61 1.49 .98 1.79 Z"
        )
    ),
    path(
        "M .43 1.07 C .49 .77 .72 .55 .86 .38 L .91 -.37 C .72 -.10 .48 .13 .34 .43 C .28 .69 .35 .89 .43 1.07 Z"
    ),
    path(
        "M .94 .40 C 1.06 .77 1.32 1.04 1.66 .91 C 2.16 .73 2.33 .20 2.03 -.14 C 2.08 .24 1.81 .55 1.43 .58 C 1.21 .61 1.08 .48 .94 .40 Z"
    ),
    path(
        "M .55 1.43 C .69 1.64 .80 1.80 .98 1.82 L 1.23 1.63 L 1.45 1.87 C 1.69 1.60 2.09 1.42 2.34 1.80 C 2.46 1.97 2.47 2.14 2.45 2.26 L 2.34 2.23 L 2.30 2.48 L 2.48 2.73 L 2.60 2.51 C 2.72 1.94 2.23 1.22 1.83 1.26 C 1.55 1.28 1.37 1.54 1.26 1.53 L 1.14 1.38 C .94 1.57 .77 1.68 .55 1.43 Z"
    ),
)

# Close reference crop: a short, cut upper wedge bends into the long lower
# tongue. The three horizontal strokes behind it are staff lines, not ink
# belonging to the clef. Dots are large, unequal lozenges straddling the F line.
F_CLEF = combine(
    path(
        "M 0 -.62 C .22 -.34 .40 -.23 .77 -.23 C 1.11 -.23 1.40 -.40 1.66 -.38 C 1.83 -.35 1.89 -.10 1.79 .07 C 1.64 .27 1.24 .34 1.04 .38 L 1.38 .69 C 1.61 .60 1.86 .60 2.06 .47 C 2.29 .28 2.23 .04 2.07 -.17 C 1.90 -.40 1.75 -.68 1.52 -.73 C 1.24 -.79 .91 -.62 .64 -.58 C .40 -.54 .21 -.56 0 -.62 Z"
    ),
    path("M 2.26 .38 L 2.60 .76 L 3.01 .47 L 2.68 .12 C 2.53 .18 2.40 .30 2.26 .38 Z"),
    path("M 2.14 -.57 L 2.47 -.22 L 2.87 -.49 L 2.54 -.86 C 2.41 -.77 2.25 -.67 2.14 -.57 Z"),
)

C_CLEF = combine(
    stroke("M .16 -1.97 C .18 -.8 .13 .98 .20 2.05", 0.23),
    stroke("M .55 -1.95 C .60 -.62 .53 .91 .59 1.97", 0.11),
    stroke("M 1.87 1.67 C 1.00 2.06 .84 .39 1.38 .03 C .86 -.43 1.07 -2.05 1.92 -1.71", 0.3),
    transform(DOT, sx=1.45, sy=1.6, dx=1.15),
)

FLAT = combine(
    stroke("M .15 -.52 C .17 .40 .12 1.84 .20 2.68", 0.14, taper=0.5),
    path(
        "M .16 .33 C .46 .75 .94 .61 .79 .13 C .70 -.16 .36 -.38 .15 -.54 L .19 -.32 C .40 -.11 .57 .11 .58 .31 C .62 .56 .31 .47 .16 .20 Z"
    ),
)
NATURAL = combine(
    stroke("M .17 -.56 C .11 .13 .16 1.18 .17 1.68", 0.13),
    stroke("M .70 -1.59 C .72 -.89 .65 .22 .73 .69", 0.13),
    path("M .14 .40 L .72 .70 L .70 .37 L .14 .15 Z M .13 -.56 L .14 -.26 L .68 .01 L .71 -.30 Z"),
)
SHARP = combine(
    stroke("M .30 -1.44 L .39 1.45 M .84 -1.29 L .91 1.64", 0.12),
    stroke("M .03 -.52 L 1.18 -.11 M .07 .32 L 1.19 .73", 0.33, nib=1.1),
)


def flag(count, down=False):
    drawings = []
    for i in range(count):
        drawings.append(
            transform(
                path(
                    "M .012 .03 L .13 -.105 L .145 -.19 C .25 -.285 .43 -.31 .57 -.44 L .665 -.525 C .79 -.66 .82 -.79 .775 -.92 L .729 -1.055 C .645 -1.245 .47 -1.48 .28 -1.66 L .205 -1.705 L .244 -1.57 C .39 -1.40 .55 -1.15 .577 -.987 L .588 -.89 C .60 -.78 .51 -.69 .39 -.64 L .268 -.60 L .16 -.54 L .012 -.405 Z"
                ),
                sx=1 - i * 0.065,
                dy=-i * 0.58,
            )
        )
    return transform(combine(*drawings), sy=-1 if down else 1)


def pen_stem(x, base, tip, joined=False):
    """The same reference-derived shaft outline used by the score renderer."""
    width = 0.14
    sides = [[], []]
    for t, left, right in STEM_PROFILE:
        if joined and t == 1:
            left, right = 0, 1
        for side, edge in zip(sides, [left, right]):
            side.append((x + (edge - .5) * width, base + (tip - base) * t))
    pen = RecordingPen()
    pen.moveTo(sides[0][0])
    for point in sides[0][1:] + sides[1][::-1]:
        pen.lineTo(point)
    pen.closePath()
    return pen if tip > base else reverse(pen)


def rest_hooks(count):
    return combine(
        stroke(f"M .25 -{.65+(count-1)*.67} C .45 -.4 .67 .54 .77 .89", 0.15),
        *(
            transform(
                combine(
                    transform(DOT, sx=1.35, sy=1.45), stroke("M .14 0 C .40 -.26 .68 -.14 .78 .20", 0.16)
                ),
                dx=0.02,
                dy=0.63 - i * 0.67,
            )
            for i in range(count)
        ),
    )


def rectangle(width, height):
    # A single squared quill stroke, with slightly bowed edges and unequal ends.
    drawing = path(
        f"M 0 0 Q {width*.45} .025 {width} -.016 L {width-.035} {height} Q {width*.5} {height-.022} .025 {height+.008} Z"
    )
    return reverse(drawing) if height > 0 else drawing


def drawings():
    glyphs = {}

    def put(names, drawing):
        for name in names.split():
            glyphs[name] = drawing

    put("gClef mensuralGclef", G_CLEF)
    put("fClef mensuralFclef", F_CLEF)
    put("cClef", C_CLEF)
    put(
        "mensuralCclef",
        combine(
            stroke(
                "M .12 -1.96 L .15 2.03 M .40 -1.95 L .44 2.01 M 2.06 -1.97 L 2.10 1.98 M 2.34 -1.99 L 2.38 2.02",
                0.12,
            ),
            stroke("M .42 .43 L 2.09 .45 M .42 -.43 L 2.09 -.45", 0.28),
        ),
    )
    for name, glyph in [("gClef", G_CLEF), ("fClef", F_CLEF), ("cClef", C_CLEF)]:
        put(name + "Change", transform(glyph, sx=0.75, sy=0.75))

    put("noteheadBlack mensuralNoteheadSemiminimaWhite", LOZENGE)
    put("noteheadHalf noteheadWhole mensuralWhiteSemibrevis mensuralNoteheadMinimaWhite", WHITE)
    breve = combine(transform(WHITE, sx=1.18), stroke("M .04 -.73 L .05 .69 M 1.49 -.72 L 1.50 .72", 0.12))
    put("noteheadDoubleWhole", breve)
    for name, w in [("mensuralNoteheadLongaWhite", 1.4), ("mensuralNoteheadMaximaWhite", 2.3)]:
        put(
            name,
            transform(
                combine(
                    rectangle(w, 1),
                    reverse(transform(rectangle(w - 0.30, 0.56), sx=-1, dx=w - 0.14, dy=0.22)),
                ),
                dy=-0.5,
            ),
        )
    put(
        "mensuralWhiteBrevis",
        combine(
            glyphs["mensuralNoteheadLongaWhite"], stroke("M .04 -.70 L .05 .71 M 1.36 -.69 L 1.37 .70", 0.10)
        ),
    )
    for name, head, stem in [
        ("mensuralWhiteMinima", WHITE, True),
        ("mensuralWhiteSemiminima", LOZENGE, True),
        ("mensuralWhiteFusa", LOZENGE, True),
        ("mensuralWhiteLonga", glyphs["mensuralNoteheadLongaWhite"], False),
        ("mensuralWhiteMaxima", glyphs["mensuralNoteheadMaximaWhite"], False),
    ]:
        x = 0.65 if stem else (1.36 if "Longa" in name else 2.26)
        put(
            name,
            combine(
                head,
                pen_stem(x, .47, 3.3 if stem else -3.4, joined="Fusa" in name),
                transform(flag(1), dx=x, dy=3.3) if "Fusa" in name else RecordingPen(),
            ),
        )

    put("augmentationDot repeatDot articStaccatoAbove articStaccatoBelow mensuralProlationCombiningDot", DOT)
    put("accidentalFlat", FLAT)
    put("accidentalDoubleFlat", combine(FLAT, transform(FLAT, dx=0.85, dy=0.015)))
    put("accidentalNatural", NATURAL)
    put("accidentalSharp", SHARP)
    put(
        "accidentalDoubleSharp",
        combine(
            stroke("M .10 -.49 L 1.00 .49 M .07 .47 L 1.02 -.48", 0.30),
            *(
                transform(DOT, dx=x, dy=y)
                for x, y in [(-0.04, -0.46), (-0.04, 0.45), (0.85, -0.46), (0.85, 0.45)]
            ),
        ),
    )
    paren = stroke("M .39 1.57 C -.01 .95 -.03 -.90 .37 -1.48", 0.12)
    put("accidentalParensLeft", paren)
    put("accidentalParensRight", transform(paren, sx=-1, dx=0.40))
    for i, value in enumerate([8, 16, 32, 64]):
        for down in [False, True]:
            put(
                f'flag{value}{"th" if value in [8,16,64] else "nd"}{"Down" if down else "Up"}',
                flag(i + 1, down),
            )

    put("restDoubleWhole", transform(rectangle(0.70, 1), dy=-0.5))
    put("restWhole", transform(rectangle(1.04, -0.47), dy=0))
    put("restHalf", rectangle(1.04, 0.47))
    put("restQuarter", stroke("M .27 1.50 L .78 .72 L .38 .27 L .84 -.34 C .04 .05 .04 -.60 .52 -1.14", 0.34))
    for i, value in enumerate([8, 16, 32, 64]):
        put(f'rest{value}{"th" if value in [8,16,64] else "nd"}', rest_hooks(i + 1))
    for name, h, y in [
        ("Maxima", 4, -2),
        ("LongaPerfecta", 4, -2),
        ("LongaImperfecta", 2, -1),
        ("Brevis", 1, 0),
        ("Semibrevis", 0.5, 0.5),
        ("Minima", 0.5, 0),
    ]:
        drawing = transform(rectangle(0.20, h), dy=y)
        if name == "Maxima":
            drawing = combine(drawing, transform(drawing, dx=0.48))
        put("mensuralRest" + name, drawing)
    put("mensuralRestSemiminima", stroke("M .11 .015 L .13 .59 L .54 .42", 0.19))
    put("mensuralRestFusa", transform(glyphs["mensuralRestSemiminima"], sx=-1, dx=0.64))
    put("mensuralRestSemifusa", combine(glyphs["mensuralRestFusa"], stroke("M .51 .32 L .10 .17", 0.19)))

    circle = stroke(
        "M .93 1.05 C .13 1.10 -.14 .41 .04 -.20 C .17 -.87 1.14 -1.03 1.65 -.45 C 2.16 .17 1.84 1.02 .93 1.05",
        0.24,
        taper=0,
    )
    common = stroke("M 1.57 .81 C .74 1.44 -.15 .58 .07 -.25 C .25 -.98 .98 -1.08 1.61 -.63", 0.27)
    cut = stroke("M .81 -1.50 L .92 1.50", 0.13)
    put("timeSigCommon", common)
    put("timeSigCutCommon", combine(common, cut))
    for i in range(1, 12):
        base = circle if i <= 4 else (transform(common, sx=-1, dx=1.70) if i in (7, 10, 11) else common)
        extra = []
        if i in (1, 4, 5, 8, 11):
            extra.append(transform(DOT, dx=0.76))
        if i in (3, 4, 8, 9, 10):
            extra.append(cut)
        put("mensuralProlation" + str(i), combine(base, *extra))
    for name, points in [
        ("TwoDots", [(0, 0), (0.55, 0)]),
        ("ThreeDots", [(0, 0), (0.55, 0), (1.1, 0)]),
        ("ThreeDotsTri", [(0, 0.34), (0.55, 0.34), (0.275, -0.34)]),
    ]:
        put("mensuralProlationCombining" + name, combine(*(transform(DOT, dx=x, dy=y) for x, y in points)))
    put("mensuralProlationCombiningDotVoid", transform(circle, sx=0.6, sy=0.6))
    put("mensuralProlationCombiningStroke", transform(cut, dx=-0.80))
    for name, ys in [("Major", [0.86, 0, -0.86]), ("Minor", [0.48, -0.48])]:
        put(
            "mensuralProportion" + name,
            combine(transform(cut, dx=-0.80), *(transform(DOT, dx=0.54, dy=y) for y in ys)),
        )
    diagonal = stroke("M .09 -1.04 L 1.91 1.06", 0.16)
    put("mensuralProportionProportioDupla1", combine(circle, stroke("M -.36 -.01 L 2.32 .035", 0.14)))
    put("mensuralProportionProportioDupla2 mensuralProportionTempusPerfectum", combine(circle, diagonal))
    put("mensuralProportionProportioTripla", combine(circle, diagonal, transform(DOT, dx=0.76)))
    put("mensuralProportionProportioQuadrupla", combine(transform(common, sx=-1, dx=1.70), diagonal))
    frame = stroke("M .07 -1.23 L 4.01 -1.25 L 4.04 1.26 L .09 1.24 Z", 0.16, taper=0)
    for name, strokes in [
        ("TempusPerfectumHoriz", "M .08 -.63 L 4.02 -.61 M .08 0 L 4.02 .03 M .08 .63 L 4.02 .65"),
        ("TempusImperfectumHoriz", "M .08 -.41 L 4.02 -.39 M .08 .41 L 4.02 .44"),
        ("ModusPerfectumVert", "M 1.36 1.25 L 1.35 -.24 M 2.68 1.25 L 2.66 -.26"),
        ("ModusImperfectumVert", "M 1.07 1.25 L 1.04 -.25 M 2.06 1.25 L 2.04 -.24 M 3.06 1.25 L 3.04 -.26"),
    ]:
        put("mensural" + name, combine(frame, stroke(strokes, 0.16)))

    for name in ["mensuralCombStemUp", "mensuralCombStemDown", "mensuralCombStemDiagonal"]:
        put(name, stroke("M -.73 -.73 L .73 .73", 0.12) if "Diagonal" in name else pen_stem(.06, 0, 3.1))
        if "Down" in name:
            glyphs[name] = transform(glyphs[name], sy=-1)
    hooks = {
        "Right": stroke("M .07 3.08 C 1.09 2.97 1.11 1.72 .08 1.75", 0.18),
        "Flared": stroke("M .07 3.08 C .18 2.48 .81 2.39 .91 2.22 L .32 1.99 L .80 1.61", 0.16),
        "Extended": stroke("M .07 3.08 C 1.12 2.94 1.08 1.72 .05 1.75 L -.49 1.74", 0.18),
        "Semiminima": stroke("M .07 3.08 L .81 2.03", 0.16),
        "Fusa": stroke("M .07 3.08 L .81 2.03 M .08 2.39 L .81 1.38", 0.16),
    }
    hooks["Left"] = transform(hooks["Right"], sx=-1, dx=0.14)
    for ending, hook in hooks.items():
        for down in [False, True]:
            direction = "Down" if down else "Up"
            put(
                "mensuralCombStem" + direction + "Flag" + ending,
                combine(glyphs["mensuralCombStem" + direction], transform(hook, sy=-1 if down else 1)),
            )

    accent = stroke("M .06 .34 L 1.09 0 L .04 -.36", 0.15)
    marcato = stroke("M .03 0 L .46 .89 L .96 -.02", 0.15)
    stress = stroke("M .04 0 C .49 .70 1.38 .71 1.87 .015", 0.17)
    soft = stroke("M .02 0 L .91 .33 L 1.82 -.02 L .92 -.31 Z", 0.15, taper=0)
    for name, drawing in [
        ("Accent", accent),
        ("SoftAccent", soft),
        ("Tenuto", stroke("M 0 0 C .26 .015 .76 -.015 1.05 .018", 0.16)),
        ("Staccatissimo", path("M .08 .67 L .32 .70 L .16 -.03 Z")),
        ("StaccatissimoStroke", stroke("M .07 0 L .22 .73", 0.20)),
        ("Marcato", marcato),
        ("Stress", stress),
        ("Unstress", transform(stress, sy=-1)),
    ]:
        put("artic" + name + "Above", drawing)
        put("artic" + name + "Below", transform(drawing, sy=-1))
    fermata = combine(
        stroke("M .04 -.01 C .02 1.34 1.96 1.39 2.04 .02", 0.25), transform(DOT, dx=0.86, dy=0.10)
    )
    put("fermataAbove", fermata)
    put("fermataBelow", transform(fermata, sy=-1))
    put(
        "breathMarkComma",
        path("M .04 .26 C .06 .60 .49 .61 .47 .28 C .47 -.07 .19 -.38 .04 -.42 C .31 -.08 .25 .02 .08 .03 Z"),
    )
    put("caesura", stroke("M 0 -.45 L .52 .59 M .65 -.45 L 1.19 .62", 0.20))
    put("graceNoteSlashStemUp", stroke("M -.31 -.36 L .91 .52", 0.15))
    put("graceNoteSlashStemDown", transform(glyphs["graceNoteSlashStemUp"], sy=-1))
    put("brace", stroke("M 1.17 3.92 C -.43 3.68 1.28 .49 .04 0 C 1.19 -.53 -.47 -3.66 1.12 -3.94", 0.36))
    return glyphs
