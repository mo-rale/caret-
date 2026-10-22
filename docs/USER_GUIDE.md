# User Guide

## 1. Getting started
Open `caret-standalone.html`, or serve the folder and visit <http://localhost:8000>
(see the [README](../README.md#run-it)).

## 2. Loading text
| Way | How |
|---|---|
| Upload a file | **Open** (above the page), the **Open file** link at the top, or **Ctrl+O**. Accepts `.txt`, `.docx`, `.pdf`. |
| Drag and drop | Drop a file anywhere on the manuscript. |
| Paste or type | Click the page and write. Analysis updates as you type. |
| Samples | **Samples ▾** loads a biased example, a neutral example, or a speech opener. |

The file name appears next to the **Manuscript** heading once a file is loaded.

Legacy `.doc` files are not supported; save them as `.docx` first. A scanned (image-only) PDF
contains no text, so Caret reports that no text could be extracted.

## 3. Reading the page
Each gender-specific term is **struck through in blue pencil**, with the first suggested replacement
written above it. The thin ruled strip on the right edge of the page is the *spine*: each blue tick
is a mark, positioned where it falls in the document. Click a tick to jump to it.

The line under the page shows the status. If nothing is found it says
**"The text has gender-neutral language."**

## 4. Fixing terms
- **One occurrence:** click the struck-out word. A slip lists the alternatives; click one. Capitalization is kept
  (`Chairman` becomes `Chairperson`).
- **Every occurrence of a term:** in the **Marks** list, click an alternative (shown in blue italics) to replace all
  occurrences of that term.
- **Everything at once:** **Accept every mark** applies the first suggestion to every flagged term.
- **Undo** reverts the last change (also Ctrl+Z when the page is not focused). **Clear** empties the page.

## 5. The margin
**Verdict** — a stamp and a score out of 100.

| Stamp | Meaning |
|---|---|
| NO COPY | nothing loaded yet |
| CLEAN | no gender-specific terms (100/100) |
| MINOR | score 90–99 |
| REVISE | score below 90 |

The score is `100 − 2 × (percentage of words that are flagged)`, never below 0. It is a rough guide,
not a formal measure. The ledger below the stamp shows the number of marks, distinct terms, and the
automaton's state count.

**Marks** — each distinct term found, how many times (`×3`), and its alternatives. Click the struck
term to jump to its first occurrence.

**Report** — the full text report: a summary table of terms, counts and alternatives, then every
occurrence with line, column and surrounding context. **Download** saves it as
`gender-neutral-report.txt`; **Copy** puts it on the clipboard.

**Machine** — type any word and press **Run** to watch the automaton read it one character at a time. Each cell on the
tape is a character; the number beneath is the state reached. A filled cell is an accepting state,
and the line below says whether the word is a term and what to write instead.

## 6. Appearance
**Night** / **Paper** (top right) switches between the dark and light themes. The first visit follows
your system setting; your choice is remembered.

## 7. Keyboard
| Key | Action |
|---|---|
| Ctrl+O | Open a file |
| Ctrl+Z | Undo (outside the text box; inside it the browser's own undo applies) |
| Esc | Close the replacement slip or the samples menu |

## 8. Privacy
All processing happens in your browser. Nothing is uploaded.
