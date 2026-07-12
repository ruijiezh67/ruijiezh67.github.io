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
