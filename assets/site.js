// danielyoung.work: small, dependency-free behaviours.
// Every feature checks for its markup first, so pages only run what they use.

(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Toast
  const toast = (msg) => {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.append(t); }
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("is-on"), 2200);
  };

  // Theme: auto (follows the system), light or dark. The head script applies it before paint.
  const applyTheme = (mode) => {
    if (mode === "light" || mode === "dark") document.documentElement.dataset.theme = mode;
    else delete document.documentElement.dataset.theme;
    $$(".theme-switch button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
  };
  let theme = store.get("theme") || "auto";
  applyTheme(theme);
  $$(".theme-switch button").forEach((b) =>
    b.addEventListener("click", () => { theme = b.dataset.mode; store.set("theme", theme); applyTheme(theme); })
  );
  const cycleTheme = () => {
    const order = ["auto", "light", "dark"];
    theme = order[(order.indexOf(theme) + 1) % 3];
    store.set("theme", theme); applyTheme(theme);
    toast(theme === "auto" ? "Theme follows your system" : `${theme[0].toUpperCase() + theme.slice(1)} mode`);
  };

  // Header border on scroll, page progress, time left
  const header = $(".site-header");
  const bar = $(".progress");
  const article = $("[data-reading]");
  const timeLeft = $$("[data-time-left]");
  const totalMins = article ? Number(article.dataset.reading) : 0;
  const onScroll = () => {
    const y = scrollY;
    header && header.classList.toggle("is-scrolled", y > 8);
    let p;
    if (article) {
      const r = article.getBoundingClientRect();
      const span = article.offsetHeight - innerHeight * 0.6;
      p = Math.min(1, Math.max(0, -r.top / Math.max(span, 1)));
      const left = Math.max(0, Math.ceil(totalMins * (1 - p)));
      const label = p >= 0.98 ? "Finished. Thanks for reading." : left <= 1 ? "Under a minute left" : `${left} min left`;
      timeLeft.forEach((el) => (el.textContent = label));
      if (p >= 0.98 && article.dataset.slug) {
        const read = JSON.parse(store.get("read") || "[]");
        if (!read.includes(article.dataset.slug)) { read.push(article.dataset.slug); store.set("read", JSON.stringify(read)); }
      }
    } else {
      const max = document.documentElement.scrollHeight - innerHeight;
      p = max > 0 ? y / max : 0;
    }
    if (bar) bar.style.transform = `scaleX(${p})`;
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  // Mark notes already read on this device
  const read = JSON.parse(store.get("read") || "[]");
  $$("[data-note-slug]").forEach((li) => li.classList.toggle("is-read", read.includes(li.dataset.noteSlug)));

  // Mobile menu
  const menuBtn = $(".menu-btn");
  const nav = $(".nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("is-open")) { nav.classList.remove("is-open"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.focus(); } });
  }

  // Hero: words come into focus one after another
  const heroH1 = $(".hero [data-words]");
  if (heroH1 && !reduced) {
    const text = heroH1.textContent.trim();
    heroH1.setAttribute("aria-label", text);
    heroH1.textContent = "";
    text.split(" ").forEach((word, i, all) => {
      const w = document.createElement("span");
      w.className = "w";
      w.setAttribute("aria-hidden", "true");
      w.textContent = word;
      w.style.transitionDelay = `${(0.15 + i * 0.09).toFixed(2)}s`;
      heroH1.append(w);
      if (i < all.length - 1) heroH1.append(" ");
    });
  }
  requestAnimationFrame(() => document.documentElement.classList.add("is-loaded"));

  // Reveal on scroll
  const reveals = $$(".reveal");
  if (reduced || !("IntersectionObserver" in window)) reveals.forEach((el) => el.classList.add("is-in"));
  else {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => io.observe(el));
  }

  // Local time in Northern Ireland, with a plain note about whether I'm likely around
  const clocks = $$("[data-clock]");
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "numeric", minute: "2-digit", hour12: true });
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "numeric", weekday: "short", hour12: false });
    const tick = () => {
      const now = new Date();
      const p = Object.fromEntries(parts.formatToParts(now).map((x) => [x.type, x.value]));
      const h = Number(p.hour) % 24;
      const weekend = p.weekday === "Sat" || p.weekday === "Sun";
      let state = "away", note;
      if (h < 7 || h >= 22) note = "I'm probably asleep. I'll reply in the morning.";
      else if (weekend) note = "It's the weekend here. I'll reply on Monday.";
      else if (h >= 9 && h < 17) { state = "awake"; note = "I'm at my desk."; }
      else note = "I'm away from my desk, but I'll see your message.";
      const time = fmt.format(now).replace(" ", " ");
      clocks.forEach((c) => { c.dataset.state = state; $("[data-clock-text]", c).textContent = `${time} in Northern Ireland. ${note}`; });
    };
    tick();
    setInterval(tick, 30000);
  }

  // Copy email
  $$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
    const text = b.dataset.copy === "url" ? location.href : b.dataset.copy;
    try { await navigator.clipboard.writeText(text); toast(b.dataset.copy === "url" ? "Link copied" : "Email address copied"); }
    catch { toast(text); }
  }));

  // Work: filter, and a preview that follows the pointer
  const filterBar = $("[data-filter-bar]");
  if (filterBar) {
    const rows = $$("[data-kind]");
    const status = $(".status", filterBar);
    const set = (kind) => {
      $$(".chip", filterBar).forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.filter === kind)));
      let n = 0;
      rows.forEach((r) => { const on = kind === "all" || r.dataset.kind === kind; r.hidden = !on; if (on) n++; });
      if (status) status.textContent = `Showing ${n} of ${rows.length}`;
      history.replaceState(null, "", kind === "all" ? location.pathname : `?show=${kind}`);
    };
    $$(".chip", filterBar).forEach((c) => c.addEventListener("click", () => set(c.dataset.filter)));
    const initial = new URLSearchParams(location.search).get("show");
    set(["client", "build"].includes(initial) ? initial : "all");
  }
  // Open a work entry linked by #id
  const openFromHash = () => {
    const d = location.hash && document.getElementById(location.hash.slice(1));
    if (d && d.tagName === "DETAILS") { d.open = true; d.closest("[data-kind]")?.removeAttribute("hidden"); }
  };
  openFromHash();
  addEventListener("hashchange", openFromHash);

  const preview = $(".preview");
  if (preview && matchMedia("(hover: hover)").matches) {
    const img = $("img", preview);
    let x = 0, y = 0, tx = 0, ty = 0, raf;
    const loop = () => { x += (tx - x) * 0.18; y += (ty - y) * 0.18; preview.style.left = `${x}px`; preview.style.top = `${y}px`; raf = requestAnimationFrame(loop); };
    $$("[data-preview]").forEach((a) => {
      a.addEventListener("pointerenter", (e) => { img.src = a.dataset.preview; tx = x = e.clientX + 170; ty = y = e.clientY; preview.classList.add("is-on"); cancelAnimationFrame(raf); loop(); });
      a.addEventListener("pointermove", (e) => { tx = e.clientX + 170; ty = e.clientY; });
      a.addEventListener("pointerleave", () => { preview.classList.remove("is-on"); setTimeout(() => cancelAnimationFrame(raf), 300); });
    });
  }

  // Machine / me ledger view
  const ledger = $(".ledger");
  if (ledger) $$("[data-view]", document).filter((b) => b.tagName === "BUTTON").forEach((b) => b.addEventListener("click", () => {
    ledger.dataset.view = b.dataset.view;
    $$(".ledger-toggle .chip").forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
  }));

  // Table of contents: highlight the section being read
  const toc = $$(".toc a");
  if (toc.length) {
    const heads = toc.map((a) => document.getElementById(a.getAttribute("href").slice(1)));
    const mark = () => {
      let i = 0;
      heads.forEach((h, n) => { if (h && h.getBoundingClientRect().top < innerHeight * 0.35) i = n; });
      toc.forEach((a, n) => a.classList.toggle("is-active", n === i));
    };
    addEventListener("scroll", mark, { passive: true });
    mark();
  }

  // Reading size, remembered across notes
  const sizes = { s: "1.0625rem", m: "1.1875rem", l: "1.375rem" };
  const applySize = (k) => {
    document.documentElement.style.setProperty("--reading-size", sizes[k] || sizes.m);
    $$("[data-size]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.size === k)));
  };
  if ($("[data-size]")) {
    applySize(store.get("size") || "m");
    $$("[data-size]").forEach((b) => b.addEventListener("click", () => { store.set("size", b.dataset.size); applySize(b.dataset.size); onScroll(); }));
  }

  // Contact: build the start of an email from chosen chips
  const builder = $("[data-builder]");
  if (builder) {
    const draft = $(".draft", builder);
    const send = $("[data-send]", builder);
    const email = builder.dataset.builder;
    const picked = (name) => $$(`[data-group="${name}"][aria-pressed="true"]`, builder).map((c) => c.textContent.trim());
    const list = (a) => a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a.at(-1)}`;
    const render = () => {
      const need = picked("need").map((t) => t.replace(/^(\w)/, (c) => c.toLowerCase())), when = picked("when")[0], name = $("#b-name", builder).value.trim(), more = $("#b-more", builder).value.trim();
      const lines = ["Hi Dan,", ""];
      lines.push(need.length ? `I'm looking for help with ${list(need)}.` : "I'd like to talk about a project.");
      if (when) lines.push(`Timing: ${when.toLowerCase()}.`);
      if (more) lines.push("", more);
      lines.push("", name ? `Thanks,\n${name}` : "Thanks,");
      const body = lines.join("\n");
      draft.textContent = body;
      const subject = need.length ? `Project enquiry: ${list(picked("need"))}` : "Project enquiry";
      send.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };
    $$(".chip", builder).forEach((c) => c.addEventListener("click", () => {
      if (c.dataset.single) $$(`[data-group="${c.dataset.group}"]`, builder).forEach((o) => o !== c && o.setAttribute("aria-pressed", "false"));
      c.setAttribute("aria-pressed", String(c.getAttribute("aria-pressed") !== "true"));
      render();
    }));
    $$("input, textarea", builder).forEach((i) => i.addEventListener("input", render));
    render();
  }

  // Print
  $$("[data-print]").forEach((b) => b.addEventListener("click", () => print()));

  // Keyboard shortcuts
  const keys = $("dialog.keys");
  $$("[data-keys]").forEach((b) => b.addEventListener("click", () => keys?.showModal()));
  let g = false, gt;
  addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (keys?.open) return;
    const k = e.key.toLowerCase();
    if (g) {
      const dest = { h: "/", w: "/work/", a: "/about/", n: "/notes/", c: "/contact/" }[k];
      g = false;
      if (dest) { location.href = dest; return; }
    }
    if (k === "g") { g = true; clearTimeout(gt); gt = setTimeout(() => (g = false), 900); }
    else if (k === "t") cycleTheme();
    else if (e.key === "?") keys?.showModal();
  });
})();

// Behind the design carousel: previous and next buttons, and a slide counter
document.querySelectorAll("[data-carousel]").forEach((root) => {
  const track = root.querySelector(".carousel__track"), slides = [...track.children];
  const count = root.querySelector("[data-count]");
  const step = () => (slides[1] ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth);
  const go = (d) => track.scrollBy({ left: d * step(), behavior: "smooth" });
  root.querySelector("[data-prev]").addEventListener("click", () => go(-1));
  root.querySelector("[data-next]").addEventListener("click", () => go(1));
  track.addEventListener("scroll", () => {
    const i = Math.round(track.scrollLeft / step());
    count.textContent = `${Math.min(slides.length, i + 1)} / ${slides.length}`;
  }, { passive: true });
});
