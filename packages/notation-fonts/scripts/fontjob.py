import io
import json
import re
import sys

from fontTools import subset
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont, newTable
from fontTools.ttLib.scaleUpem import scale_upem
from fontTools.ttLib.tables._c_m_a_p import CmapSubtable

FAMILY_NAME_IDS = (1, 3, 4, 6, 16, 17, 18, 21, 22, 25)
STAFF_SPACES_PER_EM = 4

SUBSET_OPTIONS = [
    '--no-hinting',
    '--desubroutinize',
    '--drop-tables+=GSUB,GPOS,BASE,JSTF,DSIG',
    '--name-IDs=',
    '--notdef-outline',
]


def fail(message):
    print(message, file=sys.stderr)
    sys.exit(1)


def name_value(font, name_id):
    if 'name' not in font:
        return None
    record = font['name'].getDebugName(name_id)
    return record if record else None


def outline_format(font):
    if 'CFF ' in font:
        return 'cff'
    if 'CFF2' in font:
        return 'cff2'
    return 'glyf'


def cff_names(font):
    if 'CFF ' not in font:
        return []
    cff = font['CFF '].cff
    top = cff.topDictIndex[0]
    values = list(cff.fontNames)
    for key in ('FontName', 'FullName', 'FamilyName'):
        value = top.rawDict.get(key)
        if isinstance(value, str):
            values.append(value)
    return values


def all_codepoints(font):
    merged = {}
    if 'cmap' not in font:
        return merged
    best = font.getBestCmap() or {}
    for table in font['cmap'].tables:
        for cp, glyph in table.cmap.items():
            merged.setdefault(cp, glyph)
    merged.update(best)
    return merged


def staff_spaces(value, upem):
    return round(value * STAFF_SPACES_PER_EM / upem, 3)


def glyph_bounds(glyph_set, glyph_name):
    pen = BoundsPen(glyph_set)
    glyph_set[glyph_name].draw(pen)
    return pen.bounds


def resolve_source(font, cmap, value):
    if isinstance(value, int):
        candidates = [value]
    elif isinstance(value, str) and re.fullmatch(r'(U\+|0x)[0-9A-Fa-f]+', value):
        candidates = [int(value[2:], 16)]
    elif isinstance(value, str) and len(value) == 1:
        candidates = [ord(value)]
    elif isinstance(value, str):
        return value if value in font.getGlyphOrder() else None
    else:
        return None
    for cp in candidates + [0xF000 | c for c in candidates if c < 0x100]:
        if cp in cmap:
            return cmap[cp]
    return None


def reencode(font, mapping, glyphs):
    cmap = all_codepoints(font)
    encoded = {}
    unresolved = []
    for name, value in mapping.items():
        glyph = resolve_source(font, cmap, value)
        if glyph is None:
            unresolved.append(name)
            continue
        encoded[glyphs[name]] = glyph
    tables = []
    for platform, encoding in ((3, 1), (0, 3)):
        table = CmapSubtable.newSubtable(4)
        table.platformID = platform
        table.platEncID = encoding
        table.language = 0
        table.cmap = dict(encoded)
        tables.append(table)
    font['cmap'].tables = tables
    if 'OS/2' in font:
        os2 = font['OS/2']
        if hasattr(os2, 'ulCodePageRange1'):
            os2.ulCodePageRange1 &= ~(1 << 31)
    return unresolved


def calibrate(font, notehead_cp):
    upem = font['head'].unitsPerEm
    glyph_name = font.getBestCmap().get(notehead_cp)
    if glyph_name is None:
        fail('Cannot calibrate: the mapped noteheadBlack is not in the subset font.')
    bounds = glyph_bounds(font.getGlyphSet(), glyph_name)
    if bounds is None or bounds[3] <= bounds[1]:
        fail('Cannot calibrate: the mapped noteheadBlack has no outline.')
    height = bounds[3] - bounds[1]
    target = upem / STAFF_SPACES_PER_EM
    scaled_upem = round(upem * target / height)
    if not 16 <= scaled_upem <= 16384:
        fail(f'Cannot calibrate: noteheadBlack is {height} units tall at {upem} units/em, far from one staff space.')
    scale_upem(font, scaled_upem)
    font['head'].unitsPerEm = upem
    if 'CFF ' in font:
        font['CFF '].cff.topDictIndex[0].FontMatrix = [1 / upem, 0, 0, 1 / upem, 0, 0]
    return scaled_upem / upem


def postscript_name(family):
    return re.sub(r'[^A-Za-z0-9\-]', '', family)[:63]


def rename(font, family, reserved):
    ps_name = postscript_name(family)
    if 'CFF ' in font:
        cff = font['CFF ']
        top_dict = cff.cff.topDictIndex[0]
        top_dict.rawDict['FontName'] = ps_name
        top_dict.rawDict['FullName'] = family
        top_dict.rawDict['FamilyName'] = family
        cff.cff.fontNames = [ps_name]
    if 'name' not in font:
        font['name'] = newTable('name')
        font['name'].names = []
    name = font['name']
    for name_id in (1, 4, 6, 16):
        value = ps_name if name_id == 6 else family
        name.setName(value, name_id, 3, 1, 0x409)
        name.setName(value, name_id, 1, 0, 0)
    leaks = reserved_leaks(font, reserved)
    if leaks:
        fail(f'Renaming to "{family}" left reserved font names behind: {"; ".join(leaks)}. Refusing to write this font.')


def reserved_leaks(font, reserved):
    lowered = [r.lower() for r in reserved]
    leaks = []
    if 'name' in font:
        for record in font['name'].names:
            if record.nameID not in FAMILY_NAME_IDS:
                continue
            value = record.toUnicode()
            if any(r in value.lower() for r in lowered):
                leaks.append(f'name ID {record.nameID} "{value}"')
    for value in cff_names(font):
        if any(r in value.lower() for r in lowered):
            leaks.append(f'CFF name "{value}"')
    return leaks


def subset_font(font, unicodes):
    options = subset.Options()
    options.parse_opts(SUBSET_OPTIONS)
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=unicodes)
    subsetter.subset(font)
    buffer = io.BytesIO()
    options.flavor = None
    subset.save_font(font, buffer, options)
    buffer.seek(0)
    return TTFont(buffer, recalcTimestamp=False)


def measured_metadata(font, names, glyphs):
    upem = font['head'].unitsPerEm
    cmap = font.getBestCmap()
    glyph_set = font.getGlyphSet()
    hmtx = font['hmtx']
    advances = {}
    bboxes = {}
    for name in names:
        glyph_name = cmap[glyphs[name]]
        advances[name] = staff_spaces(hmtx[glyph_name][0], upem)
        bounds = glyph_bounds(glyph_set, glyph_name) or (0, 0, 0, 0)
        bboxes[name] = {
            'bBoxNE': [staff_spaces(bounds[2], upem), staff_spaces(bounds[3], upem)],
            'bBoxSW': [staff_spaces(bounds[0], upem), staff_spaces(bounds[1], upem)],
        }
    return advances, bboxes


def build_metadata(font, job, present):
    glyphs = job['glyphs']
    defaults = None
    if job.get('defaults'):
        with open(job['defaults']) as f:
            defaults = json.load(f)
    measured_advances, measured_bboxes = measured_metadata(font, present, glyphs)
    measured = []
    if job.get('metadata'):
        with open(job['metadata']) as f:
            full = json.load(f)
        engraving = dict(full.get('engravingDefaults', {}))
        source_advances = full.get('glyphAdvanceWidths', {})
        source_bboxes = full.get('glyphBBoxes', {})
        source_anchors = full.get('glyphsWithAnchors', {})
        version = full.get('fontVersion', round(font['head'].fontRevision, 3))
    else:
        engraving = {}
        source_advances, source_bboxes, source_anchors = {}, {}, {}
        version = round(font['head'].fontRevision, 3)
    if defaults:
        for key, value in defaults['engravingDefaults'].items():
            engraving.setdefault(key, value)
    advances = {}
    bboxes = {}
    for name in present:
        if name in source_advances and name in source_bboxes:
            advances[name] = source_advances[name]
            bboxes[name] = source_bboxes[name]
        else:
            advances[name] = source_advances.get(name, measured_advances[name])
            bboxes[name] = source_bboxes.get(name, measured_bboxes[name])
            measured.append(name)
    metadata = {
        'fontName': job['family'],
        'fontVersion': version,
        'engravingDefaults': engraving,
        'glyphAdvanceWidths': advances,
        'glyphBBoxes': bboxes,
        'glyphsWithAnchors': {n: source_anchors[n] for n in present if n in source_anchors},
    }
    return metadata, measured


def build(job):
    glyphs = {name: int(cp) for name, cp in job['glyphs'].items()}
    job['glyphs'] = glyphs
    source = subset.load_font(job['input'], subset.Options(), dontLoadGlyphNames=not job.get('mapping'))
    source_head = TTFont(job['input'])['head']
    unresolved = []
    if job.get('mapping'):
        if 'noteheadBlack' not in job['mapping']:
            fail('A legacy mapping must map noteheadBlack: it calibrates the staff space.')
        unknown = [n for n in job['mapping'] if n not in glyphs]
        if unknown:
            fail(f'Mapping names glyphs outside the style tables: {", ".join(unknown)}')
        unresolved = reencode(source, job['mapping'], glyphs)
    available = set(all_codepoints(source))
    unicodes = [cp for cp in glyphs.values() if cp in available]
    if not unicodes:
        fail('The font has none of the style tables\' SMuFL codepoints. A legacy (non-SMuFL) font needs --mapping.')
    font = subset_font(source, unicodes)
    scale = None
    if job.get('mapping'):
        scale = calibrate(font, glyphs['noteheadBlack'])
    rename(font, job['family'], job.get('reserved', []))
    font['head'].created = source_head.created
    font['head'].modified = source_head.modified
    font.flavor = 'woff2'
    font.save(job['outWoff2'])
    final = TTFont(job['outWoff2'], recalcTimestamp=False)
    cmap = final.getBestCmap()
    present = [name for name, cp in glyphs.items() if cp in cmap]
    metadata, measured = build_metadata(final, job, present)
    with open(job['outMetadata'], 'w') as f:
        json.dump(metadata, f, separators=(',', ':'))
    return {
        'present': present,
        'missing': [name for name in glyphs if name not in present],
        'measured': measured,
        'unresolved': unresolved,
        'scale': scale,
        'outline': outline_format(final),
        'upem': final['head'].unitsPerEm,
    }


def info(job):
    font = TTFont(job['input'], lazy=True)
    version = name_value(font, 5)
    match = re.search(r'(\d+(?:\.\d+)*)', version or '')
    smufl = sum(1 for cp in all_codepoints(font) if 0xE000 <= cp <= 0xF8FF)
    return {
        'family': name_value(font, 16) or name_value(font, 1),
        'version': match.group(1) if match else str(round(font['head'].fontRevision, 3)),
        'copyright': name_value(font, 0),
        'licence': name_value(font, 13),
        'licenceUrl': name_value(font, 14),
        'vendorUrl': name_value(font, 11),
        'outline': outline_format(font),
        'flavor': font.flavor,
        'upem': font['head'].unitsPerEm,
        'privateUseCodepoints': smufl,
    }


def inspect(job):
    font = TTFont(job['input'])
    cmap = font.getBestCmap() or {}
    glyph_set = font.getGlyphSet()
    hmtx = font['hmtx']
    glyphs = {}
    for cp in job.get('codepoints', []):
        glyph_name = cmap.get(cp)
        if glyph_name is None:
            continue
        pen = SVGPathPen(glyph_set)
        glyph_set[glyph_name].draw(pen)
        glyphs[str(cp)] = {'d': pen.getCommands(), 'advance': hmtx[glyph_name][0]}
    names = []
    if 'name' in font:
        names = [{'nameID': r.nameID, 'value': r.toUnicode()} for r in font['name'].names]
    return {
        'upem': font['head'].unitsPerEm,
        'outline': outline_format(font),
        'family': name_value(font, 16) or name_value(font, 1),
        'familyNameIds': list(FAMILY_NAME_IDS),
        'names': names,
        'cffNames': cff_names(font),
        'cmap': sorted(cmap),
        'glyphs': glyphs,
    }


COMMANDS = {'build': build, 'info': info, 'inspect': inspect}


def main():
    job = json.load(sys.stdin)
    command = COMMANDS.get(job.get('command'))
    if command is None:
        fail(f'Unknown command {job.get("command")!r}')
    json.dump(command(job), sys.stdout)


if __name__ == '__main__':
    main()
