// Footer year
const yearElement = document.querySelector("#year");
if (yearElement) {
  yearElement.textContent = String(new Date().getFullYear());
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Glass lens that slides (on a spring, in CSS) behind the active nav link
const navEl = document.querySelector(".nav-links");
const navLens = navEl ? document.createElement("span") : null;
if (navLens) {
  navLens.className = "nav-lens";
  navLens.setAttribute("aria-hidden", "true");
  navEl.prepend(navLens);
}

const moveLens = (link, instant = false) => {
  if (!navLens) return;
  if (!link) {
    navLens.style.opacity = "0";
    return;
  }
  // appear in place the first time instead of flying in from the left edge
  const jump = instant || navLens.style.opacity !== "1";
  navLens.classList.toggle("no-anim", jump);
  navLens.style.width = `${link.offsetWidth}px`;
  navLens.style.transform = `translateX(${link.offsetLeft}px)`;
  navLens.style.opacity = "1";
  if (jump) {
    void navLens.offsetWidth;
    navLens.classList.remove("no-anim");
  }
  // on phones the nav scrolls sideways: keep the active link in view
  if (navEl.scrollWidth > navEl.clientWidth) {
    navEl.scrollTo({
      left: link.offsetLeft - (navEl.clientWidth - link.offsetWidth) / 2,
      behavior: jump || reduceMotion ? "auto" : "smooth",
    });
  }
};

// Scroll-linked chrome: progress bar, header edge, and nav scrollspy share one rAF
const progressBar = document.querySelector("#scrollProgress");
const header = document.querySelector(".site-header");
const spyPairs = [...document.querySelectorAll(".nav-links a")]
  .map((link) => [link, document.getElementById(link.hash.slice(1))])
  .filter(([, section]) => section);
let activeLink = null;
let scrollTicking = false;
let navLockUntil = 0; // after a nav click, hold the lens on the target while the page scrolls there

const setActiveLink = (link) => {
  if (link === activeLink) return;
  if (activeLink) {
    activeLink.classList.remove("is-active");
    activeLink.removeAttribute("aria-current");
  }
  if (link) {
    link.classList.add("is-active");
    link.setAttribute("aria-current", "location");
  }
  activeLink = link;
  moveLens(link);
};

spyPairs.forEach(([link]) => {
  link.addEventListener("click", () => {
    navLockUntil = performance.now() + 1200;
    setActiveLink(link);
  });
});
window.addEventListener("scrollend", () => {
  navLockUntil = 0;
  onScrollChrome();
});

const updateScrollChrome = () => {
  scrollTicking = false;
  // read layout first, then write, so scrolling never forces a synchronous reflow
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const pct = max > 0 ? Math.min(1, doc.scrollTop / max) : 0;
  const readingLine = doc.clientHeight * 0.3;
  let current = null;
  for (const [link, section] of spyPairs) {
    if (section.getBoundingClientRect().top <= readingLine) current = link;
  }
  if (pct > 0.995 && spyPairs.length) current = spyPairs[spyPairs.length - 1][0];

  if (progressBar) {
    // hue travels blue (210) -> violet -> pink (330) as you go top -> bottom
    const hue = 210 + pct * 120;
    progressBar.style.width = (pct * 100).toFixed(2) + "%";
    progressBar.style.background = `hsl(${hue.toFixed(0)}, 72%, 56%)`;
    progressBar.style.boxShadow = `0 0 12px hsla(${hue.toFixed(0)}, 72%, 56%, 0.6)`;
  }
  // the header's edge only appears once content is actually scrolling beneath it
  if (header) header.classList.toggle("is-scrolled", doc.scrollTop > 4);
  if (performance.now() > navLockUntil) setActiveLink(current);
};

function onScrollChrome() {
  if (!scrollTicking) {
    scrollTicking = true;
    requestAnimationFrame(updateScrollChrome);
  }
}
window.addEventListener("scroll", onScrollChrome, { passive: true });
window.addEventListener("resize", () => {
  moveLens(activeLink, true);
  onScrollChrome();
}, { passive: true });
updateScrollChrome();

// Scroll reveal: fade + rise elements into view as they enter the viewport
const revealEls = [...document.querySelectorAll(".reveal, .reveal-photo")];

// Once revealed, drop the reveal styles so each component's own, faster hover and
// press transitions apply again (the reveal transition and stagger delay would lag them)
const finishReveal = (el) => {
  el.classList.remove("reveal", "reveal-photo");
  el.style.transitionDelay = "";
};

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealEls.forEach((el) => {
    el.classList.add("in-view");
    finishReveal(el);
  });
} else {
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
  );

  // Stagger siblings slightly for a softer cascade
  revealEls.forEach((el) => {
    const group = el.parentElement;
    const index = group ? [...group.children].indexOf(el) : 0;
    el.style.transitionDelay = `${Math.min(index, 6) * 55}ms`;
    el.addEventListener("transitionend", function onRevealEnd(e) {
      if (e.target !== el || e.pseudoElement || !el.classList.contains("in-view")) return;
      el.removeEventListener("transitionend", onRevealEnd);
      finishReveal(el);
    });
    revealObserver.observe(el);
  });
}

// Confetti burst on avatar click (white + blue palette, like a celebratory tap)
const portrait = document.querySelector(".portrait");
if (portrait && !reduceMotion) {
  portrait.setAttribute("title", "Click me!");

  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const sizeCanvas = () => {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  sizeCanvas();
  window.addEventListener("resize", sizeCanvas);

  const colors = ["#1e4e79", "#2f6db3", "#3b82c4", "#5aa0dd", "#7fb3e6", "#a9cef0", "#ffffff"];
  let pieces = [];
  let running = false;

  const spawn = () => {
    const r = portrait.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      pieces.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        w: 5 + Math.random() * 6,
        h: 3 + Math.random() * 5,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.4,
        color: colors[(Math.random() * colors.length) | 0],
        life: 0,
        ttl: 90 + Math.random() * 50,
      });
    }
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  };

  let lastTick = 0;
  const tick = (now) => {
    // scale the per-frame physics by real elapsed time so 120Hz screens don't run it double speed
    const k = lastTick ? Math.min(3, (now - lastTick) / (1000 / 60)) : 1;
    lastTick = now;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    pieces = pieces.filter((p) => p.life < p.ttl);
    for (const p of pieces) {
      p.life += k;
      p.vy += 0.16 * k;
      p.vx *= Math.pow(0.99, k);
      p.x += p.vx * k;
      p.y += p.vy * k;
      p.rot += p.vr * k;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.ttl);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (pieces.length) {
      requestAnimationFrame(tick);
    } else {
      running = false;
      lastTick = 0;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  };

  portrait.addEventListener("click", spawn);
}

// Interactive 3D work deck — grab and drag to scrub, flick, click, arrows, or ‹ › buttons
const deck = document.querySelector("#deck");
if (deck) {
  const cards = [...deck.querySelectorAll(".deck-card")];
  const n = cards.length;
  const detailEl = document.querySelector("#deckDetail");
  const ddTag = document.querySelector("#ddTag");
  const ddTitle = document.querySelector("#ddTitle");
  const ddAffil = document.querySelector("#ddAffil");
  const ddDesc = document.querySelector("#ddDesc");
  const ddLink = document.querySelector("#ddLink");
  const countEl = document.querySelector("#deckCount");
  const prevBtn = document.querySelector("#deckPrev");
  const nextBtn = document.querySelector("#deckNext");
  const stage = deck.closest(".deck-stage") || deck;

  const pad = (x) => String(x).padStart(2, "0");
  const STEP_PX = 115; // horizontal drag distance for one card

  let pos = 0; // fractional position (which card is up front)
  let target = 0; // where we're easing toward
  let raf = null;
  let dragging = false;
  let lastInfo = -1;

  // shortest signed distance from a card index to the current position, wrapped
  const wrapDelta = (d) => {
    d %= n;
    if (d > n / 2) d -= n;
    if (d <= -n / 2) d += n;
    return d;
  };

  const place = (card, d) => {
    let tx, ty, tz, ry, sc, op, br, zi;
    if (d >= 0) {
      // active (d≈0) up front; the rest fan up-and-right behind it
      tx = d * 44;
      ty = d * -38;
      tz = d * -140;
      ry = -6 - Math.min(d, 1) * 20;
      sc = 1 - d * 0.04;
      op = d > 4.4 ? 0 : 1;
      br = 1 - Math.min(d, 4) * 0.12;
      zi = 1000 - Math.round(d * 10);
    } else {
      // just-passed cards slide down-left toward the viewer and fade out
      const a = -d;
      tx = -a * 132;
      ty = a * 40;
      tz = a * 140;
      ry = 6 + a * 30;
      sc = 1 - a * 0.05;
      op = Math.max(0, 1 - a * 1.15);
      br = 1;
      zi = 1400 - Math.round(a * 10);
    }
    card.style.transform = `translate3d(${tx}px, ${ty}px, ${tz}px) rotateY(${ry}deg) scale(${sc})`;
    card.style.opacity = op;
    card.style.filter = `brightness(${br})`;
    card.style.zIndex = zi;
    // faded-out cards sit above the stack (higher z-index): keep them from swallowing clicks and hover
    card.style.pointerEvents = op < 0.1 ? "none" : "";
    card.setAttribute("aria-hidden", op < 0.1 ? "true" : "false");
    card.classList.toggle("is-front", Math.abs(d) < 0.5);
    card.tabIndex = Math.abs(d) < 0.5 ? 0 : -1;
  };

  const render = () => {
    cards.forEach((card, i) => place(card, wrapDelta(i - pos)));
    // While dragging, details follow the finger; otherwise they show the destination at once,
    // so a tap on a back card updates the text immediately instead of flickering through each card
    const shown = dragging ? pos : target;
    const idx = ((Math.round(shown) % n) + n) % n;
    if (idx !== lastInfo) {
      // content slides in from the side the deck is moving toward
      if (detailEl && lastInfo !== -1) detailEl.dataset.dir = wrapDelta(idx - lastInfo) < 0 ? "prev" : "next";
      lastInfo = idx;
      const a = cards[idx];
      if (ddTag) ddTag.textContent = a.dataset.tag;
      if (ddTitle) ddTitle.textContent = a.dataset.title;
      if (ddAffil) ddAffil.textContent = a.dataset.affil;
      if (ddDesc) ddDesc.textContent = a.dataset.desc;
      if (ddLink) ddLink.setAttribute("href", a.dataset.href);
      if (countEl) countEl.textContent = `${pad(idx + 1)} / ${pad(n)}`;
      if (detailEl) {
        detailEl.classList.remove("dd-in");
        void detailEl.offsetWidth;
        detailEl.classList.add("dd-in");
      }
    }
  };

  // Spring physics using Apple's response/damping model: frame-rate independent,
  // interruptible, and velocity carries through every re-target (no "brick wall").
  const SETTLE = { response: 0.42, damping: 1 }; // calm default, no overshoot
  const FLICK = { response: 0.42, damping: 0.8 }; // slight bounce, only after a real flick
  let spring = SETTLE;
  let vel = 0; // cards per second
  let lastFrame = 0;

  const animate = (now) => {
    const dt = Math.min(0.064, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    const stiffness = ((2 * Math.PI) / spring.response) ** 2;
    const friction = (4 * Math.PI * spring.damping) / spring.response;
    const steps = Math.max(1, Math.ceil(dt * 240));
    const h = dt / steps;
    for (let s = 0; s < steps; s++) {
      vel += (-stiffness * (pos - target) - friction * vel) * h;
      pos += vel * h;
    }
    if (Math.abs(target - pos) < 0.0008 && Math.abs(vel) < 0.01) {
      pos = target;
      vel = 0;
      render();
      raf = null;
      return;
    }
    render();
    raf = requestAnimationFrame(animate);
  };

  const tweenTo = (t, { velocity, flick = false } = {}) => {
    target = t;
    spring = flick ? FLICK : SETTLE;
    if (velocity !== undefined) vel = velocity;
    if (reduceMotion) {
      pos = t;
      vel = 0;
      render();
      return;
    }
    if (!raf) {
      lastFrame = performance.now();
      raf = requestAnimationFrame(animate);
    }
  };

  const step = (delta) => tweenTo(Math.round(target) + delta);

  // --- pointer drag: cards track the pointer 1:1; on release the pointer's
  // velocity is handed to the spring and projected forward like a real throw ---
  const DECELERATION = 0.99; // Apple's momentum projection, snappy variant
  const project = (v) => ((v / 1000) * DECELERATION) / (1 - DECELERATION);

  const TAP_SLOP = 8; // px of movement still treated as a tap rather than a drag
  let startX = 0;
  let startPos = 0;
  let moved = 0;
  let samples = []; // recent pointer positions for release velocity

  // Bring card i to the front along the shortest path; tapping the front card advances, as before
  const bringToFront = (i) => {
    const base = Math.round(pos);
    const delta = wrapDelta(i - (((base % n) + n) % n));
    tweenTo(base + (delta === 0 ? 1 : delta));
  };

  // Pointer capture retargets the click to the deck, so taps are resolved by hit-testing
  // the release point; only visible cards count
  const cardAt = (x, y) =>
    document
      .elementsFromPoint(x, y)
      .map((el) => el.closest(".deck-card"))
      .find((card) => card && deck.contains(card) && parseFloat(card.style.opacity) > 0.1);

  deck.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return; // ignore right/middle clicks
    dragging = true;
    startX = e.clientX;
    startPos = pos; // grab from the on-screen value, never the target
    moved = 0;
    vel = 0;
    samples = [{ x: e.clientX, t: e.timeStamp }];
    takeControl();
    if (raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
    deck.classList.add("dragging");
    if (deck.setPointerCapture) {
      try {
        deck.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    samples.push({ x: e.clientX, t: e.timeStamp });
    while (samples.length > 2 && e.timeStamp - samples[0].t > 100) samples.shift();
    pos = startPos - dx / STEP_PX;
    render();
  });

  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    deck.classList.remove("dragging");

    if (e.type === "pointerup" && moved < TAP_SLOP) {
      const card = cardAt(e.clientX, e.clientY);
      if (card) bringToFront(cards.indexOf(card));
      else tweenTo(Math.round(pos)); // tapped empty stage: just settle
      return;
    }

    // Release velocity (px/s) over the last ~100ms; zero if the pointer had come to rest
    const first = samples[0];
    const last = samples[samples.length - 1];
    let pxPerSec = 0;
    if (e.type === "pointerup" && last.t > first.t && e.timeStamp - last.t < 80) {
      pxPerSec = ((last.x - first.x) / (last.t - first.t)) * 1000;
    }
    const cardVel = -pxPerSec / STEP_PX;
    const flick = Math.abs(pxPerSec) > 300;

    // Snap to the card nearest where the gesture is going, not where it was released
    let dest = Math.round(pos + Math.max(-2, Math.min(2, project(cardVel))));
    if (flick) {
      // a deliberate flick always commits at least one card in its direction
      dest = cardVel > 0 ? Math.max(dest, Math.floor(pos) + 1) : Math.min(dest, Math.ceil(pos) - 1);
    }
    tweenTo(dest, { velocity: cardVel, flick });
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  // Keyboard activation (Enter/Space on the focused card); pointer taps are handled in endDrag
  cards.forEach((card, i) => {
    card.addEventListener("click", (e) => {
      if (e.detail !== 0) return;
      takeControl();
      bringToFront(i);
    });
  });

  if (prevBtn) prevBtn.addEventListener("click", () => (takeControl(), step(-1)));
  if (nextBtn) nextBtn.addEventListener("click", () => (takeControl(), step(1)));

  deck.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      takeControl();
      step(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      takeControl();
      step(-1);
    }
  });

  // Gentle auto-drift, only until the visitor takes control: once they pick a card,
  // it stays put. It also pauses on hover, while offscreen, and in a hidden tab.
  let timer = null;
  let userControlled = false;
  let deckOnScreen = false;
  function startAuto() {
    if (reduceMotion || timer || dragging || userControlled || !deckOnScreen || document.hidden) return;
    timer = window.setInterval(() => step(1), 4600);
  }
  function stopAuto() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  function takeControl() {
    userControlled = true;
    stopAuto();
  }
  stage.addEventListener("pointerenter", stopAuto);
  stage.addEventListener("pointerleave", startAuto);
  stage.addEventListener("focusin", stopAuto);
  stage.addEventListener("focusout", startAuto);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      deckOnScreen = entry.isIntersecting;
      if (deckOnScreen) startAuto();
      else stopAuto();
    }, { threshold: 0.35 }).observe(stage);
  } else {
    deckOnScreen = true;
  }

  render();
  startAuto();
}

// Foldable "full experience" lists
document.querySelectorAll(".fold-toggle").forEach((btn) => {
  const fold = document.getElementById(btn.getAttribute("aria-controls"));
  const label = btn.querySelector(".ft-label");
  if (!fold) return;
  btn.addEventListener("click", () => {
    const open = fold.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (label) label.textContent = open ? "Hide full experience" : "Show full experience";
    if (open) fold.querySelectorAll(".reveal").forEach((el) => el.classList.add("in-view"));
  });
});
