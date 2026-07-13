// Footer year
const yearElement = document.querySelector("#year");
if (yearElement) {
  yearElement.textContent = String(new Date().getFullYear());
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
