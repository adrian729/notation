"""Post-process a pyftsubset OTF: rename CFF fontName + name table IDs 1/4/6/16
to the renamed family (OFL rename obligation, font.md), then save as WOFF2.
--name-IDs='' leaves the name table empty and the CFF fontName untouched —
this fills both back in under the new name.

Takes the vendored source OTF as a fifth argument: its head timestamps are copied
onto the output so repeated builds are byte-identical. Without this, fontTools
stamps head.modified with the current time on every save, the WOFF2 changes on
every rebuild, and there is no way to tell a real glyph change from noise.
"""
import sys
from fontTools.ttLib import TTFont

src, dst_otf, dst_woff2, family, source_otf = sys.argv[1:6]

font = TTFont(src, recalcTimestamp=False)

cff = font['CFF ']
top_dict = cff.cff.topDictIndex[0]
top_dict.rawDict['FontName'] = family
top_dict.rawDict['FullName'] = family
top_dict.rawDict['FamilyName'] = family
cff.cff.fontNames = [family]

name = font['name']
for name_id in (1, 4, 6, 16):
    name.setName(family, name_id, 3, 1, 0x409)  # Windows, Unicode BMP, en-US
    name.setName(family, name_id, 1, 0, 0)       # Mac, Roman, English

# The OFL reserves "Bravura", so every name record must read as the renamed
# family. A subset that leaves a stale name behind ships a licence breach, and it
# is invisible in the WOFF2's bytes — assert it here, where it is fixable.
for record in font['name'].names:
    value = record.toUnicode()
    if 'bravura' in value.lower():
        raise SystemExit(
            f'Name ID {record.nameID} still reads "{value}" after renaming to "{family}".'
            ' The OFL reserves "Bravura"; refusing to write this font.'
        )

head = font['head']
source_head = TTFont(source_otf)['head']
head.created = source_head.created
head.modified = source_head.modified

font.save(dst_otf)

font.flavor = 'woff2'
font.save(dst_woff2)
print(f'Renamed to "{family}", wrote {dst_otf} and {dst_woff2}')
