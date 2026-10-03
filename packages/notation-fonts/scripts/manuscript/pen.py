"""Pen-edge studies, normalized from head/join (0) towards the terminal (1).

The stem follows the narrow shaft at x≈110, y64–91 in the second supplied
photograph. Ignore the horizontal ruling where it crosses the shaft: the pen
broadens below its pointed entry, loses pressure lower down, then seats into
the head. These are outline samples, not a wavy centreline or scanned noise.
The beam adapts the uneven edges of broad diagonal head strokes; connected
modern beams are not clearly present in the supplied pages.

Each row is [distance along the stroke, left edge, right edge], normalized to
its allocated length and width. This one master serves both the complete-note
font drawings and the renderer's variable-length stems.
"""

STEM_PROFILE = [
    [0.00, 0.00, 1.00],
    [0.06, 0.10, 0.94],
    [0.15, 0.18, 0.90],
    [0.28, 0.31, 0.86],
    [0.40, 0.24, 0.88],
    [0.51, 0.16, 0.85],
    [0.63, 0.04, 0.93],
    [0.74, 0.00, 1.00],
    [0.83, 0.08, 0.95],
    [0.91, 0.23, 0.88],
    [0.97, 0.36, 0.79],
    [1.00, 0.48, 0.67],
]

BEAM_PROFILE = [
    [0.00, 0.00, 1.00],
    [0.05, 0.06, 0.98],
    [0.12, 0.04, 0.93],
    [0.19, 0.09, 0.95],
    [0.28, 0.06, 0.89],
    [0.36, 0.04, 0.92],
    [0.47, 0.07, 0.94],
    [0.56, 0.02, 0.91],
    [0.65, 0.05, 0.95],
    [0.74, 0.08, 0.96],
    [0.81, 0.03, 0.91],
    [0.89, 0.06, 0.95],
    [0.95, 0.02, 0.98],
    [1.00, 0.00, 1.00],
]
