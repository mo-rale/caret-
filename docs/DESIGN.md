# Design Document

## 1. Objective
Recognize and validate gender-specific language in documents using finite state automata, and
propose gender-neutral alternatives.

## 2. Architecture
```
 file (.txt/.docx/.pdf) --> readFile() --> plain text --> TermAutomaton.findAll() --> matches
                                                                                        |
                                     LEXICON (term -> alternatives) --------------------+--> UI / Report
```
| Component | File | Role |
|---|---|---|
| Document readers | `readFile()` in `app.js` | `.txt` via `File.text()`, `.docx` via *mammoth*, `.pdf` via *pdf.js* |
| Lexicon | `lexicon.js` | 58 terms, each mapped to one or more neutral alternatives |
| Automaton | `fsa.js` | `TermAutomaton`: builds the DFA, scans text, traces words |
| Analysis, report, edits | `app.js` | `analyze()`, `buildReport()`, replacement, undo |
| Interface | `index.html`, `style.css` | the proof-desk layout and visual system |

Legacy `.doc` is rejected with a message asking the user to save as `.docx` (see §6).

## 3. The finite state automaton

### 3.1 Formal definition
The recognizer is a deterministic finite automaton **M = (Q, Σ, δ, q0, F)**:

- **Σ** – the characters of the normalized text.
- **Q** – the states of a trie built from the lexicon. Each state is a prefix of one or more terms;
  `q0` (the root) is the empty prefix. For the supplied lexicon, |Q| = 373.
- **δ : Q × Σ → Q** – trie edges give the forward moves. For a character with no edge, δ follows
  *failure links* to the longest proper suffix that is also a prefix of some term (the Aho-Corasick
  construction). This makes δ total, so the machine never backs up in the input.
- **q0** – the start state.
- **F** – the accepting states: states where a lexicon term ends, plus states whose failure chain
  reaches such a state (a term is a suffix of what was just read).

Fragment for the terms `he`, `she`, `his`:
```
q0 --h--> q1 --e--> q2 (accept: "he")
q0 --s--> q3 --h--> q4 --e--> q5 (accept: "she", and "he" via the failure link to q2)
q1 --i--> q6 --s--> q7 (accept: "his")
```

### 3.2 Scanning algorithm (`findAll`)
1. **Normalize.** Lowercase; collapse whitespace runs to one space; unify Unicode dashes to `-` and
   curly quotes to `'`. An index map links each normalized position to its original position, so
   results point at the real text.
2. **Run.** Start in `q0`; apply δ once per character. Whenever the new state is accepting, record each
   term that ends there as a candidate.
3. **Word-boundary check.** Reject a candidate that is immediately preceded or followed by a letter,
   digit or apostrophe. This stops `he` matching inside `the` or `she`, and `chairman` inside
   `chairmanship`.
4. **Resolve overlaps.** Sort candidates by start position, longest first, and keep the
   non-overlapping ones. So `his or her` wins over `his` + `her`, and `ladies and gentlemen` wins over
   `gentlemen`.

Complexity: O(n + z) for text length n and z candidate matches, independent of lexicon size once
built. Construction is O(total length of all terms).

### 3.3 Why an automaton
A loop of `text.includes(term)` would work but rescans the text once per term. The automaton reads each
character exactly once, and it makes the automata-theory concept visible: the **Machine** tab shows the
state path for any input.

## 4. Lexicon
58 entries covering pronouns (`he`, `she`, `his or her`…), occupations (`chairman`, `stewardess`,
`policeman`…) and general terms (`mankind`, `man-made`, `manpower`…). To extend it, add an entry to
`lexicon.js`; the automaton is rebuilt from it on every page load.

Deliberately excluded: titles such as *Mr/Mrs/Ms* and *sir/madam* (frequent false positives, no
universally accepted replacement).

## 5. Report and interface behaviour
- **Report:** summary (term, count, alternatives, most frequent first) and an occurrence list (line,
  column, matched text, suggestion, context). If nothing is found it states
  **"The text has gender-neutral language."**
- **Replacement** preserves capitalization (`Chairman` → `Chairperson`, `HE` → `THEY`) and then
  re-runs the analysis. Replacements are applied from the end of the text backwards so earlier
  offsets stay valid.
- **Undo** keeps a history of the text (up to 100 states).
- **Score** = `100 − 2 × flagged-word percentage`, floored at 0, capped at 99 while any mark exists, and
  exactly 100 only when no term is found.

## 6. Limitations
- Matching is lexical, not grammatical. `her` can become "them" or "their" depending on use, so both are
  suggested. `man` as a verb or in names is not handled (and `man` alone is not in the lexicon).
- Other languages, slang and context-dependent bias are out of scope.
- Scanned (image-only) PDFs have no text and cannot be read without OCR.
- **Legacy binary `.doc` files are not supported.** `.docx` is a zip of XML that a library reads easily;
  `.doc` is a proprietary binary format with no reliable browser library.
- `.docx` / `.pdf` readers are loaded from a CDN and need an internet connection.

## 7. Interface design: the proof desk
The product is a copy editor's tool, so the interface borrows from proofreading rather than from
generic app templates.

| Element | Idea |
|---|---|
| Flagged term | struck through in blue pencil, correction written above the line, as on a marked proof |
| Verdict | a rubber stamp (NO COPY / CLEAN in green / MINOR in ochre / REVISE in red) rather than a gauge |
| Spine | ruled strip beside the page, one blue tick per mark, clickable |
| Marks list | numbered footnote-style entries, not cards |
| Machine view | a tape of character cells with the state number beneath each |
| Surface | cool grey-white paper, navy-black ink and a single blue-pencil accent (editors mark with blue pencil); "Night" mode uses a deep blue-black |
| Type | Libre Caslon Text (a traditional book face) for reading, Courier Prime (typewriter) for machine labels |
| Controls | typewriter-caps text links; one square inked button with a hard offset shadow |
| Motion | the stamp landing, the tape feeding, entries easing in; all disabled for reduced-motion users |
