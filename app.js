(function () {
  const NEUTRAL = "The text has gender-neutral language.";
  const $ = (id) => document.getElementById(id);
  const fsa = new TermAutomaton(Object.keys(LEXICON));

  const editor = $("editor"), backdropIn = $("backdropIn"), banner = $("banner"), pop = $("pop");
  let matches = [], source = "(pasted text)", timer = null, history = [], playTimer = null;

  const SAMPLES = {
    biased: "The chairman told the stewardess that he would call his wife about the businessman's request.\n\nEvery policeman and fireman must report his hours. The manpower shortage affects mankind, and the salesman said the guys on the team are doing a great job.\n\nLadies and gentlemen, welcome.",
    neutral: "The chairperson told the flight attendant that they would call their partner about the businessperson's request.\n\nEvery police officer and firefighter must report their hours. The workforce shortage affects humankind, and the salesperson said everyone on the team is doing a great job.",
    speech: "Ladies and gentlemen, boys and girls, thank you for joining us. Our spokesman and the headmistress will explain how each freshman can contact his or her advisor.",
  };

  $("statStates").textContent = fsa.numStates;

  const setBanner = (kind, msg) => { banner.className = "banner " + kind; banner.textContent = msg; };
  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 2200);
  }

  // ---------- helpers ----------
  function matchCase(orig, repl) {
    if (orig.length > 1 && orig === orig.toUpperCase() && /[A-Z]/.test(orig)) return repl.toUpperCase();
    if (/^[A-Z]/.test(orig)) return repl[0].toUpperCase() + repl.slice(1);
    return repl;
  }
  function pushHistory() {
    if (history[history.length - 1] !== editor.value) history.push(editor.value);
    if (history.length > 100) history.shift();
    $("undoBtn").disabled = history.length < 2;
  }
  // apply replacements (array of {m, alt}); work from the end so offsets stay valid
  function applyReplacements(list) {
    let v = editor.value;
    [...list].sort((a, b) => b.m.start - a.m.start).forEach(({ m, alt }) => {
      v = v.slice(0, m.start) + matchCase(m.text, alt) + v.slice(m.end);
    });
    editor.value = v; pushHistory(); analyze(); return list.length;
  }

  // ---------- analysis ----------
  function analyze() {
    const text = editor.value;
    matches = fsa.findAll(text);
    const summary = new Map();
    for (const m of matches) summary.set(m.term, (summary.get(m.term) || 0) + 1);

    const words = (text.match(/[\p{L}\p{N}'’-]+/gu) || []).length;
    $("wc").textContent = words + (words === 1 ? " word" : " words");
    $("cc").textContent = text.length + " characters";
    $("rt").textContent = Math.max(words ? 1 : 0, Math.round(words / 220)) + " min read";
    $("statTotal").textContent = matches.length;
    $("statDistinct").textContent = summary.size;
    $("fixAllBtn").hidden = !matches.length;

    if (!text.trim()) setBanner("info", "Upload a document or paste text to begin.");
    else if (!matches.length) setBanner("ok", NEUTRAL);
    else setBanner("warn", `Found ${matches.length} gender-specific term${matches.length > 1 ? "s" : ""}. Click a highlight or use a suggestion.`);

    renderScore(text, words);
    renderSummary(summary);
    renderBackdrop(text);
    renderSpine(text);
    $("report").textContent = buildReport(text, summary);
  }

  function renderScore(text, words) {
    let flaggedWords = 0;
    for (const m of matches) flaggedWords += (m.text.match(/\S+/g) || []).length;
    let score = null;
    if (text.trim() && words) score = Math.max(0, Math.round(100 - (flaggedWords / words) * 100 * 2));
    if (score != null && matches.length) score = Math.min(score, 99);
    if (!matches.length && words) score = 100;
    const [cls, label, s] = score == null ? ["", "NO COPY", "Add some text to see how it reads."]
      : score === 100 ? ["s-clean", "CLEAN", NEUTRAL]
      : score >= 90 ? ["s-minor", "MINOR", "A few small corrections and it is clean."]
      : score >= 65 ? ["s-revise", "REVISE", "Several gendered terms. Work through the marks."]
      : ["s-revise", "REVISE", "Heavily gendered wording. Accept every mark, then review."];
    const stamp = $("stamp");
    if (!stamp.classList.contains(cls) || (!cls && stamp.className !== "stamp")) {
      stamp.className = "stamp " + cls; void stamp.offsetWidth; stamp.classList.add("hit");
    }
    $("stampT").textContent = label;
    $("scoreN").textContent = score == null ? "– / 100" : score + " / 100";
    $("scoreSub").textContent = s;
  }

  // spine: proportional ticks showing where marks fall; click to jump
  function renderSpine(text) {
    const sp = $("spine"); sp.textContent = "";
    for (const m of matches) {
      const i = document.createElement("i");
      i.style.top = `calc(${(m.start / Math.max(1, text.length)) * 100}% - 1px)`;
      i.title = `“${m.text}” → ${LEXICON[m.term][0]}`;
      i.onclick = () => jumpTo(m.term, m);
      sp.append(i);
    }
  }

  function renderSummary(summary) {
    const ul = $("summary"); ul.textContent = "";
    const empty = $("summaryEmpty");
    empty.innerHTML = editor.value.trim()
      ? 'No marks. The page is clean.<small>Nothing left to correct</small>'
      : 'The desk is empty.<small>Open a file, paste text, or pick a sample</small>';
    [...summary].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).forEach(([term, n], i) => {
      const li = document.createElement("li"); li.className = "find"; li.style.animationDelay = i * 35 + "ms";
      const top = document.createElement("div"); top.className = "find-top";
      const tEl = document.createElement("button"); tEl.className = "term"; tEl.textContent = term; tEl.title = "Jump to first occurrence";
      tEl.onclick = () => jumpTo(term);
      const c = document.createElement("span"); c.className = "count"; c.textContent = "×" + n;
      top.append(tEl, c);
      const alts = document.createElement("div"); alts.className = "alts";
      alts.innerHTML = '<span class="alts-l">Write</span>';
      for (const a of LEXICON[term]) {
        const b = document.createElement("button"); b.className = "chip"; b.textContent = a; b.title = "Replace every occurrence";
        b.onclick = () => { const k = applyReplacements(matches.filter((m) => m.term === term).map((m) => ({ m, alt: a }))); toast(`Replaced ${k} × ${term}`); };
        alts.append(b);
      }
      li.append(top, alts); ul.append(li);
    });
  }

  // live highlight layer behind the textarea
  function renderBackdrop(text) {
    backdropIn.textContent = "";
    let pos = 0;
    matches.forEach((m, i) => {
      backdropIn.append(text.slice(pos, m.start));
      const mk = document.createElement("mark"); mk.textContent = m.text; mk.dataset.i = i;
      mk.dataset.fix = matchCase(m.text, LEXICON[m.term][0]);
      backdropIn.append(mk); pos = m.end;
    });
    backdropIn.append(text.slice(pos) + "​\n");
    syncScroll();
  }
  function syncScroll() {
    backdropIn.style.transform = `translateY(${-editor.scrollTop}px)`;
    $("editorWrap").style.setProperty("--sy", editor.scrollTop + "px");
  }
  editor.addEventListener("scroll", () => { syncScroll(); hidePop(); });

  function jumpTo(term, hit) {
    const m = hit || matches.find((x) => x.term === term); if (!m) return;
    editor.focus(); editor.setSelectionRange(m.start, m.end);
    const ratio = m.start / Math.max(1, editor.value.length);
    editor.scrollTop = Math.max(0, ratio * editor.scrollHeight - editor.clientHeight / 2);
    syncScroll();
    const mk = backdropIn.querySelector(`mark[data-i="${matches.indexOf(m)}"]`);
    mk?.classList.add("sel"); setTimeout(() => mk?.classList.remove("sel"), 900);
  }

  // ---------- report ----------
  function lineCol(text, pos) {
    const before = text.slice(0, pos);
    return [before.split("\n").length, pos - (before.lastIndexOf("\n") + 1) + 1];
  }
  function buildReport(text, summary) {
    if (!text.trim() || !matches.length) return text.trim() ? NEUTRAL : "";
    const L = ["GENDER-NEUTRAL LANGUAGE REPORT", "Source: " + source, "=".repeat(60),
      `Gender-specific terms found: ${matches.length} (${summary.size} distinct)`, "",
      "Term".padEnd(22) + "Count".padStart(6) + "  Suggested alternative(s)", "-".repeat(60)];
    [...summary].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .forEach(([t, n]) => L.push(t.padEnd(22) + String(n).padStart(6) + "  " + LEXICON[t].join(", ")));
    L.push("", "Occurrences", "-".repeat(60));
    for (const m of matches) {
      const [ln, col] = lineCol(text, m.start);
      const ctx = text.slice(Math.max(0, m.start - 25), m.end + 25).replace(/\n/g, " ");
      L.push(`Line ${ln}, col ${col}: "${m.text}" -> ${LEXICON[m.term].join(" / ")}`, `    ...${ctx}...`);
    }
    return L.join("\n");
  }
  $("dlBtn").onclick = () => {
    const txt = $("report").textContent; if (!txt) return toast("Nothing to download yet");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
    a.download = "gender-neutral-report.txt"; a.click(); URL.revokeObjectURL(a.href);
  };
  $("copyBtn").onclick = () => {
    const txt = $("report").textContent; if (!txt) return toast("Nothing to copy yet");
    navigator.clipboard?.writeText(txt).then(() => toast("Report copied"), () => toast("Copy failed"));
  };

  // ---------- click a highlight -> popover ----------
  function matchAt(pos) { return matches.findIndex((m) => pos >= m.start && pos <= m.end); }
  editor.addEventListener("click", () => {
    if (editor.selectionStart !== editor.selectionEnd) return hidePop();
    const i = matchAt(editor.selectionStart);
    if (i < 0) return hidePop();
    const m = matches[i];
    const mk = backdropIn.querySelector(`mark[data-i="${i}"]`); if (!mk) return;
    pop.textContent = "";
    const t = document.createElement("div"); t.className = "pop-title"; t.textContent = `Strike “${m.text}” — write`; pop.append(t);
    for (const alt of LEXICON[m.term]) {
      const b = document.createElement("button"); b.textContent = matchCase(m.text, alt);
      b.onclick = () => { hidePop(); applyReplacements([{ m, alt }]); };
      pop.append(b);
    }
    const r = mk.getBoundingClientRect();
    pop.hidden = false;
    pop.style.left = Math.max(8, Math.min(r.left + scrollX, innerWidth - 210)) + "px";
    pop.style.top = r.bottom + scrollY + 8 + "px";
  });
  function hidePop() { pop.hidden = true; }
  document.addEventListener("mousedown", (e) => { if (!pop.contains(e.target) && e.target !== editor) hidePop(); });

  // ---------- editor events ----------
  editor.addEventListener("input", () => {
    clearTimeout(timer);
    renderBackdrop(editor.value);
    timer = setTimeout(() => { analyze(); pushHistory(); }, 180);
    source = "(pasted text)"; $("fileChip").hidden = true;
  });
  $("fixAllBtn").onclick = () => {
    const k = applyReplacements(matches.map((m) => ({ m, alt: LEXICON[m.term][0] })));
    toast(`${k} mark${k > 1 ? "s" : ""} accepted · Undo to revert`);
  };
  $("undoBtn").onclick = undo;
  function undo() {
    if (history.length < 2) return;
    history.pop(); editor.value = history[history.length - 1];
    $("undoBtn").disabled = history.length < 2; analyze();
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { hidePop(); $("sampleMenu").hidden = true; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") { e.preventDefault(); $("file").click(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && document.activeElement !== editor) { e.preventDefault(); undo(); }
  });
  $("clearBtn").onclick = () => {
    if (editor.value) { pushHistory(); }
    editor.value = ""; $("fileChip").hidden = true; source = "(pasted text)"; pushHistory(); analyze(); editor.focus();
  };

  // samples menu
  $("sampleBtn").onclick = (e) => { e.stopPropagation(); $("sampleMenu").hidden = !$("sampleMenu").hidden; };
  document.addEventListener("click", () => ($("sampleMenu").hidden = true));
  $("sampleMenu").querySelectorAll("button").forEach((b) => (b.onclick = () => {
    editor.value = SAMPLES[b.dataset.s]; source = "(sample: " + b.dataset.s + ")"; $("fileChip").hidden = true;
    pushHistory(); analyze();
  }));

  // ---------- tabs with sliding ink ----------
  const tabs = [...document.querySelectorAll(".tab")];
  tabs.forEach((t) => t.addEventListener("click", () => {
    tabs.forEach((x) => x.classList.toggle("active", x === t));
    document.querySelectorAll(".pane").forEach((p) => (p.hidden = p.id !== t.dataset.pane));
  }));
  $("openTop").onclick = () => $("file").click();

  // ---------- file reading ----------
  async function readFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "txt") return file.text();
    if (ext === "docx") {
      if (!window.mammoth) throw new Error("DOCX reader failed to load (check your internet connection).");
      return (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
    }
    if (ext === "pdf") {
      if (!window.pdfjsLib) throw new Error("PDF reader failed to load (check your internet connection).");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const c = await (await pdf.getPage(i)).getTextContent();
        let line = "", out = "";
        for (const it of c.items) { line += it.str; if (it.hasEOL) { out += line + "\n"; line = ""; } else if (it.str && !/\s$/.test(it.str)) line += " "; }
        pages.push(out + line);
      }
      return pages.join("\n\n");
    }
    if (ext === "doc") throw new Error("Legacy .doc isn't supported. Save it as .docx in Word and try again.");
    throw new Error(`Unsupported file type ".${ext}". Use .txt, .docx or .pdf.`);
  }
  async function loadFile(file) {
    if (!file) return;
    try {
      setBanner("info", "Reading " + file.name + "…");
      const text = await readFile(file);
      editor.value = text; source = file.name;
      const chip = $("fileChip"); chip.textContent = file.name; chip.hidden = false;
      pushHistory(); analyze();
      if (!text.trim()) setBanner("err", "No text could be extracted (scanned PDF?).");
    } catch (err) { setBanner("err", err.message); }
  }
  $("file").addEventListener("change", (e) => { loadFile(e.target.files[0]); e.target.value = ""; });
  $("uploadLbl").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("file").click(); } });
  const card = $("docCard"), wrap = $("editorWrap");
  let depth = 0;
  card.addEventListener("dragenter", (e) => { e.preventDefault(); depth++; wrap.classList.add("over"); });
  card.addEventListener("dragover", (e) => e.preventDefault());
  card.addEventListener("dragleave", () => { if (--depth <= 0) { depth = 0; wrap.classList.remove("over"); } });
  card.addEventListener("drop", (e) => { e.preventDefault(); depth = 0; wrap.classList.remove("over"); loadFile(e.dataTransfer.files[0]); });

  // ---------- automaton inspector (animated) ----------
  function inspect(animate) {
    clearTimeout(playTimer);
    const word = $("fsaInput").value, box = $("fsaTrace"), v = $("fsaVerdict");
    box.textContent = ""; v.textContent = "";
    const steps = fsa.trace(word);
    // tape: one cell per character, the state reached sits beneath it
    const draw = (i) => {
      const s = steps[i];
      const cell = document.createElement("div");
      cell.className = "cell" + (i === 0 ? " start" : "") + (s.accept && s.accept.length ? " acc" : "");
      const b = document.createElement("b"); b.textContent = i === 0 ? "⊢" : s.ch === " " ? "␣" : s.ch;
      const q = document.createElement("i"); q.textContent = "q" + s.state;
      cell.append(b, q); box.append(cell);
    };
    const finish = () => {
      const last = steps[steps.length - 1];
      if (last.accept && last.accept.length) {
        const t = last.accept[0];
        v.textContent = `Accepted — “${t}”, write ${LEXICON[t].join(" or ")}.`; v.style.color = "var(--pencil)";
      } else {
        v.textContent = word.trim() ? "Rejected. Not a term on the list." : ""; v.style.color = "var(--mute)";
      }
    };
    if (!animate) { steps.forEach((_, i) => draw(i)); return finish(); }
    let i = 0;
    (function tick() { draw(i++); if (i < steps.length) playTimer = setTimeout(tick, 280); else finish(); })();
  }
  $("fsaInput").addEventListener("input", () => inspect(false));
  $("playBtn").onclick = () => inspect(true);

  // ---------- theme ----------
  $("themeBtn").onclick = () => {
    const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next; themeLabel();
    try { localStorage.setItem("neutral-theme", next); } catch (e) {}
  };
  function themeLabel() {
    const dark = (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
    $("themeLbl").textContent = dark ? "Paper" : "Night";
  }

  history.push(""); themeLabel(); inspect(false); analyze();
})();
