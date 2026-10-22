# Caret

*A proof desk for inclusive language.* — by Ahron Badili

Caret is a web application that uses a **finite state automaton (FSA)** to recognize gender-specific
terms in text documents and to suggest gender-neutral alternatives. Flagged words are marked up the
way an editor marks a proof: struck through in blue pencil, with the suggested replacement written above.

Everything runs in the browser. Documents are never uploaded anywhere.

## Run it

Option 1 — open `caret-standalone.html` (double-click). It is a single self-contained file.

Option 2 — serve the folder:

```
python -m http.server 8000 --directory "<path to this folder>"
```

then open <http://localhost:8000> (type `localhost`, not the `[::]` address Python prints).

`.docx` and `.pdf` reading uses the *mammoth* and *pdf.js* libraries from a CDN, so those two formats
need an internet connection. `.txt` and pasted text work offline.

## Files

```
index.html               page structure
style.css                visual design (the "proof desk" system)
app.js                   UI logic: analysis, mark-up, replace, report, file reading, tape view
fsa.js                   the finite state automaton (Aho-Corasick DFA)
lexicon.js               gender-specific terms -> neutral alternatives (58 terms)
caret-standalone.html    index.html with CSS and JS inlined (one file)
tests/fsa.test.js        automated tests for the automaton (node tests/fsa.test.js)
samples/                 test files in every format, with expected results (see samples/README.md)
docs/                    USER_GUIDE.md, DESIGN.md, TESTING.md
```

If you edit `style.css`, `app.js` or the lexicon, `caret-standalone.html` must be regenerated to
include the change.

## Requirements coverage

| # | Requirement | Where |
|---|---|---|
| 1 | Upload `.txt`, `.docx`, `.pdf` | `readFile()` in `app.js` (Open button, Ctrl+O, drag and drop) |
| 2 | Scan using finite state automata | `fsa.js` (`TermAutomaton`), used by `analyze()` in `app.js` |
| 3 | Predefined gender-specific terms with neutral alternatives | `lexicon.js` |
| 4 | Report of occurrences and suggested replacements | **Report** tab (`buildReport()` in `app.js`); download or copy |
| 5 | Message "The text has gender-neutral language." when nothing is found | status line under the manuscript, verdict note, and report |

Scope note: legacy `.doc` files are not read. Caret shows a message asking the user to save the file
as `.docx`. See [docs/DESIGN.md](docs/DESIGN.md#6-limitations).

## Documentation

- [User guide](docs/USER_GUIDE.md)
- [Design: the automaton, architecture, interface](docs/DESIGN.md)
- [Testing and requirement traceability](docs/TESTING.md)
