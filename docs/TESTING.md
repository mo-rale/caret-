# Testing

## Automated tests
Run (Node.js, no dependencies):

```
node tests/fsa.test.js
```

Result: **10 / 10 passing**; the automaton has 373 states.

| Test | Verifies |
|---|---|
| basic terms | "The chairman said he would go." gives `chairman`, `he` |
| word boundaries | no hits in "other", "there", "chairmanship"; `she` found in "She left." |
| case-insensitive, original text kept | "STEWARDESS" matches and keeps its casing |
| longest phrase wins | `his or her` and `ladies and gentlemen` win over their parts |
| whitespace and hyphen variants | extra spaces or a line break inside a phrase; non-breaking hyphen in `man-made` |
| punctuation adjacent | `(he), "she"; him.` are all recognized |
| positions index the real text | match offsets slice the correct word |
| neutral text has no matches | "The chairperson said they would go." gives no matches |
| requirement examples have alternatives | `he` → they, `chairman` → chairperson, `stewardess` → flight attendant |
| trace accepts a lexicon term | the Machine view's trace ends in an accepting state for `chairman` |

## Manual checks performed
Served over `http://localhost`:
- Loading the biased sample: 12 marks, 11 distinct terms, highlights and corrections aligned with the text.
- **Accept every mark** → no marks, stamp CLEAN, status "The text has gender-neutral language."; **Undo**
  restored all 12 marks.
- Machine tab: `chairman` run through the tape, accepted with "chairperson or chair".
- Dark theme and a phone-width layout rendered correctly; no console errors.

## Not tested
- Uploading a real `.docx` or `.pdf` through the file dialog.
- Dragging a file onto the page.
- Browsers other than the one used for the checks.

Suggested extra check: create a `.docx` and a `.pdf` containing "The chairman and the stewardess…",
open each in Caret, and confirm the same two terms are reported.

## Requirement traceability
| Requirement | Evidence |
|---|---|
| 1. Upload .txt/.docx/.pdf | `readFile()`; `.docx`/`.pdf` still need the manual check above |
| 2. FSA scanning | `fsa.js`; all tests in `tests/fsa.test.js` |
| 3. Predefined term list + alternatives | `lexicon.js` (58 terms); "requirement examples" test |
| 4. Report with occurrences and replacements | **Report** tab; manual check |
| 5. Neutral message | manual check (status line after Accept every mark); `neutral text has no matches` test |
