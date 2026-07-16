// Footer year
const yearElement = document.querySelector("#year");
if (yearElement) {
  yearElement.textContent = String(new Date().getFullYear());
}

// Scroll progress bar: fills with scroll depth and shifts hue by page position
const progressBar = document.querySelector("#scrollProgress");
if (progressBar) {
  let ticking = false;
  const updateProgress = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? Math.min(1, doc.scrollTop / max) : 0;
    // hue travels blue (210) -> violet -> pink (330) as you go top -> bottom
    const hue = 210 + pct * 120;
    progressBar.style.width = (pct * 100).toFixed(2) + "%";
    progressBar.style.background = `hsl(${hue.toFixed(0)}, 72%, 56%)`;
    progressBar.style.boxShadow = `0 0 12px hsla(${hue.toFixed(0)}, 72%, 56%, 0.6)`;
    ticking = false;
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateProgress);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  updateProgress();
}

// Scroll reveal: fade + rise elements into view as they enter the viewport
const revealEls = [...document.querySelectorAll(".reveal, .reveal-photo")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealEls.forEach((el) => el.classList.add("in-view"));
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

  const tick = () => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    pieces = pieces.filter((p) => p.life < p.ttl);
    for (const p of pieces) {
      p.life++;
      p.vy += 0.16;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
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
  const titleEl = document.querySelector("#deckTitle");
  const metaEl = document.querySelector("#deckMeta");
  const linkEl = document.querySelector("#deckLink");
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
      tx = d * 70;
      ty = d * -46;
      tz = d * -165;
      ry = -6 - Math.min(d, 1) * 20;
      sc = 1 - d * 0.04;
      op = d > 4.4 ? 0 : 1;
      br = 1 - Math.min(d, 4) * 0.12;
      zi = 1000 - Math.round(d * 10);
    } else {
      // just-passed cards slide down-left toward the viewer and fade out
      const a = -d;
      tx = -a * 168;
      ty = a * 46;
      tz = a * 150;
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
    card.setAttribute("aria-hidden", op < 0.1 ? "true" : "false");
    card.tabIndex = Math.abs(d) < 0.5 ? 0 : -1;
  };

  const render = () => {
    cards.forEach((card, i) => place(card, wrapDelta(i - pos)));
    const idx = ((Math.round(pos) % n) + n) % n;
    if (idx !== lastInfo) {
      lastInfo = idx;
      const a = cards[idx];
      if (titleEl) titleEl.innerHTML = a.dataset.title;
      if (metaEl) metaEl.innerHTML = a.dataset.meta;
      if (linkEl) linkEl.setAttribute("href", a.dataset.href);
      if (countEl) countEl.textContent = `${pad(idx + 1)} / ${pad(n)}`;
    }
  };

  const animate = () => {
    pos += (target - pos) * 0.16;
    if (Math.abs(target - pos) < 0.0008) {
      pos = target;
      render();
      raf = null;
      return;
    }
    render();
    raf = requestAnimationFrame(animate);
  };

  const tweenTo = (t) => {
    target = t;
    if (reduceMotion) {
      pos = t;
      render();
      return;
    }
    if (!raf) raf = requestAnimationFrame(animate);
  };

  const step = (delta) => tweenTo(Math.round(target) + delta);

  // --- pointer drag: cards follow the cursor 1:1, snap on release ---
  let startX = 0;
  let startPos = 0;
  let moved = 0;
  let vel = 0;
  let lastX = 0;

  deck.addEventListener("pointerdown", (e) => {
    dragging = true;
    startX = lastX = e.clientX;
    startPos = pos;
    moved = 0;
    vel = 0;
    stopAuto();
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
    vel = e.clientX - lastX;
    lastX = e.clientX;
    pos = startPos - dx / STEP_PX;
    render();
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    deck.classList.remove("dragging");
    // a flick carries a little momentum
    const flick = Math.abs(vel) > 6 ? Math.sign(vel) * -1 : 0;
    tweenTo(Math.round(pos) + flick);
    startAuto();
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  // click a card to bring it to the front (ignored right after a drag)
  cards.forEach((card, i) => {
    card.addEventListener("click", (e) => {
      if (moved > 6) {
        e.preventDefault();
        return;
      }
      const rounded = Math.round(target);
      const delta = wrapDelta(i - ((rounded % n) + n) % n);
      tweenTo(rounded + (Math.abs(delta) < 0.5 ? 1 : delta));
    });
  });

  if (prevBtn) prevBtn.addEventListener("click", () => step(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => step(1));

  deck.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      step(-1);
    }
  });

  // gentle auto-drift — pauses on hover, drag, or when the tab is hidden
  let timer = null;
  function startAuto() {
    if (reduceMotion || timer || dragging) return;
    timer = window.setInterval(() => step(1), 4600);
  }
  function stopAuto() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  stage.addEventListener("pointerenter", stopAuto);
  stage.addEventListener("pointerleave", startAuto);
  stage.addEventListener("focusin", stopAuto);
  stage.addEventListener("focusout", startAuto);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });

  render();
  startAuto();
}

// Nav scrollspy: highlight the section currently in view
const sections = [...document.querySelectorAll("section[id]")];
const navLinks = [...document.querySelectorAll(".nav-links a")];

if (sections.length && navLinks.length) {
  const spy = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) =>
        link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`)
      );
    },
    { rootMargin: "-25% 0px -60% 0px", threshold: [0.1, 0.25, 0.5] }
  );
  sections.forEach((section) => spy.observe(section));
}
