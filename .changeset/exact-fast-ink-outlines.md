---
"@polyhymnia/notation-engine": patch
---

Lay out scores about 1.6× faster: pen-stroke outlines round their coordinates without formatting a string per number. The output is identical, including exact ties, which still round like `toFixed`.
