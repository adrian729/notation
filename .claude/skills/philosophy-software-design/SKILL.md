---
name: philosophy-software-design
description: Code design rules that minimize complexity — deep modules, information hiding, simple interfaces, error handling, comments, naming, consistency. Use when designing, writing, changing, refactoring, or reviewing code or APIs, or when asked for design or code-quality feedback. NOT for trivial mechanical edits (typos, renames, formatting, lint fixes) or AI instruction files (ai-instruction-file-authoring).
---

# Philosophy of Software Design

Minimize **complexity**: anything in code structure that makes it hard to understand or change — judged by the next developer (human or AI) who reads or modifies it, not by ease of writing.

## When each part fires

1. **Before coding, or asked to design/propose a module, class, API, or feature** → new code: Designing new code (skip only for trivial local edits); modifying existing code: Changing existing code.
2. **Designing or writing** → apply Principles; override popular habits per Common habits to override. Red flag detected → stop; find more than one alternative that eliminates it before continuing.
3. **Before presenting code** → Pre-present checklist.
4. **Reviewing** → Reviewing code.

## Core rules

- **Symptoms** — diagnose and explain findings with:
  - **Change amplification** — one conceptual change needs edits in many places → give each design decision one home.
  - **Cognitive load** — much must be known to make a change (for you: how much code must be read into context) → hide detail behind simpler interfaces; more lines can be simpler if callers need to know less.
  - **Unknown unknowns** (worst) — unclear what a change must touch (for you: a site neither structure nor search reveals) → make structure and dependencies obvious.
- **Causes**: **dependencies** (code can't be understood or changed in isolation → fewer of them, each simple and obvious) and **obscurity** (important information not obvious → fix the design first; code needing lots of explanation signals a design problem).
- **Small addition ("just one special case", "just one more parameter")** → complexity accrues from such small additions and is hard to remove later; never accept a kludge because it's small.
- **Done check** → working code isn't done. Done = works *and* design is as clean as if the system had been designed with this change in mind from the start. Change adds a special case, flag parameter, duplicated logic, or cross-module leak that a cleaner design would eliminate → reject it, even as the smallest change that works; redesign. Never trade complexity for speed or a smaller diff. Not making the design better → probably making it worse.
- **Improve incrementally** → each change leaves design a little better. No complete up-front design of the whole system; no deferring cleanup doable now ("clean up later" TODOs).
- **Limits** → every rule has one; explicit ones are marked **Limit**. Test = total complexity went down, not whether a rule was followed.

## Procedures

### Designing new code (module, class, API, feature)

1. **Decide what matters** — who calls it, the common use, what callers must know. That's the interface; hide the rest. Design abstractions first, and how the design absorbs likely future changes, not just this feature. Unsure → state a hypothesis ("the common case is X"), design around it, tell the user so it can be revisited.
2. **Design it twice** — sketch ≥2 structurally different interfaces, not variants of one idea (your first idea tends to be the most conventional pattern, not the best fit). Compare callers' code simplicity first, then interface simplicity, generality, efficiency. Pick one or combine their strengths. Significant choice → tell the user the alternatives and why you picked one.
3. **Describe each abstraction before implementing** — in your reasoning, not the code; also for every method or field added later, including when changing existing code. For the module, each public method, and each important field, write what a caller needs: what it does or represents, arguments, return, side effects, errors — complete enough to use it without reading the body; never shorten by omitting something callers need. Fluent text is always possible, so judge the description, not the effort:
   - One or two plain sentences plus argument/return notes → good; proceed.
   - Several sentences, "if/unless/except" conditions, or "and" joining unrelated duties → interface too complex → back to step 2.
   - Explainable only by how it works → shallow → merge it, or move more behind it.
   - Field needs a long description → wrong state decomposition → rethink.
4. **Implement**, pulling complexity down and defining errors out (see Pull complexity downward; Errors and special cases).
5. **Before presenting**: code → run the Pre-present checklist; design-only answer → check the proposed design against Red flags.

### Changing existing code (bug fix, feature, refactor)

1. **Read surrounding code first**; adopt its conventions (naming, error handling, structure, doc format). Find every caller and user of what you change; a missed one is an unknown unknown.
2. **Ask whether the design is still right** given the change. Not right → refactor touched code so the result looks designed for it; don't bolt the change on.
3. **Change adds a non-trivial module, interface, or feature** → run Designing new code steps 1–3 for it first.
4. **Fix small design problems in code you're already changing** — vague name, stale comment, duplicated logic.
5. **Right refactor exceeds the task** (large, risky, many modules, breaks APIs others use) → make the cleanest feasible change in scope and tell the user the proper design and remaining debt. Don't silently settle; don't make large unrequested rewrites.
6. **Finish**: update or delete comments the change invalidated. Future developers need to know why code must be this way (e.g. the obvious version reintroduces a bug) → state it as a standing fact about the code, not a description of the change, in a comment passing the Comments tests; readers don't look in commit messages or replies to the user.
7. **Run the Pre-present checklist.**

### Reviewing code

1. Scan for every entry in Red flags and for the three symptoms.
2. Per finding, name the symptom it causes (e.g. "change amplification: file format known by both `Reader` and `Writer`") and give a concrete fix.
3. Judge obviousness from what's visible, not what you know — especially for code you wrote or just read (Red flags: Nonobvious code).

## Pre-present checklist

Run on final diff; any "no" → fix first.

1. No Red flags entry introduced by the diff; small design problems in code you changed fixed (Changing step 4); design not right for the change → refactored (Changing step 2) or proper design and debt reported (Changing step 5)?
2. No special case, flag parameter, duplicated logic, or cross-module leak added that a cleaner design would eliminate (Done check)?
3. Every caller and user of changed code found?
4. Each added module, public method, and important field describable in one or two plain sentences plus argument/return notes (Designing step 3)?
5. Every comment the diff adds or changes passes the four Comments tests; comments the change invalidated updated or deleted?
6. No leftover debug code; no "clean up later" TODO for cleanup doable now?
7. Codebase conventions matched; no new convention introduced in one spot?
8. Reply tells the user, where applicable: alternatives and why you picked one, for significant choices; design hypotheses; proper design and remaining debt for out-of-scope refactors?
9. No speedup claimed without before/after measurement?

## Red flags

Detect → fix.

- **Shallow module** — interface barely simpler than implementation, e.g. `addNullValueForAttribute(attr) { data.put(attr, null); }` → deepen, or merge into caller or callee; never add a class, method, or wrapper that hides no meaningful complexity.
- **Information leakage** — same design decision (file format, protocol detail, invariant) in several modules → merge them, or extract one owner module whose interface truly hides it; otherwise you've only moved the leak.
- **Temporal decomposition** — modules split by execution order (read → parse → process → write) and share knowledge → regroup by knowledge. HTTP server: reading and parsing a request belong together (`Content-Length` tells where it ends).
- **Overexposure** — common use requires knowing rare features → default the common case; separate the rare (Deep modules).
- **Pass-through method** — only forwards to a method with a similar signature → expose the lower object, redistribute responsibilities, or merge the classes. Fine when it's a dispatcher choosing among implementations, or one of multiple implementations of one interface.
- **Repetition** — same nontrivial code in several places → extract the missing abstraction, or restructure so it's needed once.
- **Special-general mixture** — use-specific code in a general mechanism (leakage) → keep one general mechanism; push use-specific logic up (callers, application, UI) or down (adapters such as drivers).
- **Conjoined methods** — one can't be understood without the other → merge, or re-cut along a real abstraction (Together or apart).
- **Comment repeats code** — all of it obvious from the code → delete, or say what the code can't.
- **Narrating comment** — describes the change, its history, your reasoning, or the request instead of a fact about the code → delete.
- **Implementation documentation contaminates interface** — interface comment explains how → remove the how (keep only as an implementation comment passing the Comments tests); reconsider the module's depth.
- **Vague name** — `data`, `count`, `status`, `x` → name what it specifically is (Naming).
- **Hard to pick name** — some name always comes, so judge it: precise name needs more than about three words, needs "And"/"Or", or only a bare generic word fits (`Helper`, `Util`, `Manager`, `process()`, `handle()`; `IndexletManager` is fine) → unclear purpose or does too much; rethink and refactor the entity.
- **Hard to describe** — complete description of a method or field needs several sentences or many conditions → abstraction wrong; redesign (Designing step 3).
- **Nonobvious code** — behavior unpredictable from call site, names, and interface without the body → simplify, rename, or restructure; comment only if it passes the Comments tests (Obviousness).

## Principles

### Deep modules

- **Make modules deep** → simple interface, substantial functionality. Depth = functionality hidden relative to interface complexity; applies to services, classes, methods alike.
- **Classitis (many small classes)** → prefer fewer, deeper ones; each adds interface, boilerplate. Java needs `FileInputStream` + `BufferedInputStream` + `ObjectInputStream` to read serialized objects.
- **Make the common case simple** → frequent path is the default; rare features sit behind a separate mechanism most callers never learn. Unix I/O: sequential by default, `lseek` optional. Java I/O: buffering is an explicit extra object; forgetting it silently costs performance.
- **Interface = everything a caller must know**, including what the signature doesn't show (behavior, ordering constraints, side effects, errors) → minimize; document the rest.
- **Each class, method, parameter, option** adds something to learn → keep only if it removes more complexity than it adds. Parameter irrelevant to most callers, or required setting with an obvious default → cut.

### Information hiding

- **Hide design decisions** → each module encapsulates a few (data structures, algorithms, formats, assumptions), absent from its interface.
- **`private` isn't hidden** — getter returning the internal `Map`, or API mirroring internal storage, exposes representation → shape the interface around callers' needs: a text class stored as lines still offers character-range `insert`/`delete`, so callers never split/join lines.
- **Interface omits information callers need** → false abstraction forcing them to read the implementation; surface it in the interface or its documentation.
- **Within a class** → each private method encapsulates one capability; minimize places each field is used.

### General-purpose vs special-purpose

- **Make modules somewhat general-purpose** → implement only today's needs, but don't tie the interface to one use; general interfaces are usually simpler, deeper. Text class: `insert(position, text)`/`delete(range)`, not `backspace()`/`deleteSelection()`.
- **Self-check each new interface**: simplest interface covering all current needs? How many situations will use this method (one → red flag)? Easy to use for current needs (callers need much extra code → too general)?

### Layers

- **Each layer must provide a different abstraction** from layers above and below.
- **Pass-through variable** (threaded through methods that don't use it) → put it in an object both ends already share, or a context object for system-wide state (contents immutable where possible); global = last resort.
- **Decorator/wrapper** → usually shallow; first consider putting the feature in the base class, the caller, an existing decorator, or an independent class.

### Pull complexity downward

- **Simple interface beats simple implementation** → modules have more callers than implementers; handle complexity inherent to a module's job inside it, not in callers.
- **Don't punt decisions to callers** → no exception for a condition the module can handle; no configuration parameter for a value it can compute (e.g. a retry interval from measured response times). Expose a parameter only if callers can genuinely choose better, and give it a sensible default.
- **Limit**: pull down only complexity that belongs to the module's function, simplifies many callers and the interface. Pulling in caller-specific behavior (a `backspace` method in a text class) is leakage.

### Together or apart

- **Combine code that shares information**, is always used together, overlaps conceptually, or can't be understood without the other. Separate only if total complexity drops: a disk cache and a general-purpose hash table stay apart.
- **Method is long** → don't split for length. Split only when a piece is a clean abstraction understandable on its own, or the method does several unrelated things. A long method with a simple signature that reads top to bottom is fine.
- **Limit**: callers must call both halves, or readers must flip between them (conjoined methods) → rejoin.

### Errors and special cases

Exceptions are part of the interface; handlers rarely run and are often buggy → minimize places that handle errors:

- **Define errors out of existence** → pick semantics where the would-be error is normal behavior: `unset` ensures absence instead of failing if already absent; `substring` clamps out-of-range indices instead of throwing; Unix deletes an open file and frees it at the last close.
- **Callers needn't know** → mask at low level: retry, resend (as TCP does), recover internally.
- **Aggregate** → propagate to one high-level handler (e.g. top of the request loop), not a catch at each call site; put the human-readable message in the exception so the handler stays generic. Route rare errors into an existing recovery path instead of writing a new one.
- **Rare unrecoverable condition** (out of memory, corrupted internal state) → crash: log diagnostics, abort. Wrap such primitives so callers can't forget the check (`ckalloc` around `malloc`).
- **Special case needs `if` checks** → design it out: "no selection" is an empty selection (start == end); internal model needn't mirror the user-visible one.
- **Limit**: never hide an error the caller must act on; a network module that swallows all errors makes robust applications impossible.

### Comments

- **Default: no comments.** The design check (Designing step 3) happens in your reasoning regardless. Comment only if all four tests hold; unsure → omit:
  1. A future reader or caller needs it to use or change the code correctly.
  2. The code, names, and types don't already say it.
  3. It stays true while the code is unchanged — nothing about the change, its history, your reasoning, or the request.
  4. An interface comment describes usage only, never implementation.
- **Project or user instructions override this default in either direction**; project requires doc comments → use its format and the rules below.
- **Interface comment** → short, plain usage description (Designing step 3): what it does or represents, plus the contract the signature can't show: inclusive/exclusive bounds, units, meaning of null, ownership, side effects, errors, preconditions. No algorithm, data structures, or internal steps. Can't write it that way → fix the design, not the comment.
- **Implementation comment** → only what a reader can't infer: why a non-obvious approach is needed (hardware quirk, subtle bug a naive rewrite would reintroduce), indirect control flow (when and by whom an event handler runs), surprising behavior (a constructor that starts threads). Place at the narrowest scope covering its code.
- **Same fact needed in several places** → document it once and refer to it elsewhere; reference external docs (RFCs, manuals) instead of copying them.

### Naming

- **Be precise** → a name shows what the entity is and isn't: `fileBlock`/`diskBlock`, not `block` (ambiguity once silently corrupted data); `numIndexlets`, not `getCount`; `charIndex`/`lineIndex`, not `x`/`y`; `cursorVisible`, not `blinkStatus`; `NOT_YET_VOTED`, not `VOTED_FOR_SENTINEL_VALUE`; `mergedLine`, not `result` (`result` only for the returned value). Booleans are predicates.
- **Scale length to declaration-to-use distance** → `i` in a three-line loop, not a field. Don't over-specify: `delete(Range range)`, not `delete(Range selection)`.
- **Be consistent** → one name per recurring purpose, everywhere, never reused for anything else; prefixes for roles (`srcFileBlock`/`dstFileBlock`); `i` for outer loops, `j` for nested.
- **User or reviewer finds a name unclear** → it is; change it, don't defend it.

### Consistency

- **Match what's there** → names, style, interfaces, error handling, patterns, invariants; codebase conventions override your default idioms. Similar things done alike; different things visibly different.
- **New convention in one spot, even a better one** → don't. Change a convention only with strong reason and by updating every existing use; otherwise propose it to the user.
- **Tooling** → follow the project's linters, formatters, checkers; convention keeps being violated → suggest automating its check.
- **Limit**: don't force dissimilar things to look alike; consistency helps only when "looks like x" means "is x".

### Obviousness

- **Obvious = reader's first guess is correct** → reduce what they must know (abstraction, no special cases), build on what they know (conventions), state the rest (names, comments).
- **Design for reading, not writing** → spend effort writing so every later reader spends less.
- **Generic container (`Pair`, tuple) whose elements have meaningless names** → replace with a small type with named fields.
- **Declare the type you rely on** → declaring `List` but allocating `ArrayList` misleads about behavior and performance.

### Performance

- **Write naturally efficient simple code** → know expensive operations (network round-trips, disk I/O, allocation, cache misses); pick cheap alternatives costing no complexity (hash table over ordered map, contiguous array over pointer chains).
- **Complexity for speed** → only with evidence that performance matters; hide it behind an interface.
- **Measure before and after** → profile for real hot spots and baseline; revert a change without measurable gain unless it also simplified code. Can't measure → say so; don't claim a speedup.
- **Design the critical path** → find the minimal code the common case must run, then the clean design closest to it; move special cases off the fast path behind one up-front check.

## Common habits to override

Apply these popular practices only where they reduce complexity:

- **"Functions should be small"** → don't split for length (Together or apart); don't substitute a long, sentence-like method name for a comment.
- **"More small classes and layers is cleaner"** → classitis, pass-throughs, shallow wrappers; prefer deeper modules.
- **Getters/setters for every field** → expose behavior, not state.
- **Throw on every odd input** → define errors out, mask, aggregate.
- **Defensive "just in case" checks and fallbacks** (extra null checks, try/catch around calls that can't fail, silent defaults) → each is a special case to read and maintain. Handle a condition only where it can really occur; never mask a real error with a silent default.
- **"Make it configurable"** → compute a sensible value; knob only for a real need.
- **Design patterns** → only when the problem genuinely fits.
- **Implementation inheritance** → couples parent and subclasses via shared state; prefer composition. Interface inheritance (one interface, many implementations) is fine and deepens.
- **Test-driven development** → keep unit tests (they make refactoring safe), but design the abstraction first, not grow code test by test; unit of development is an abstraction, not a feature. User asks for TDD → follow it, still designing the interface first. Bug fix → write the failing test first.
