// Shared, lightweight scroll animations for every page (loaded once via Layout.astro).
// No external dependencies: IntersectionObserver + CSS transitions only, so it adds
// almost nothing to bundle size. Fully respects prefers-reduced-motion.

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initScrollReveal() {
  const targets = document.querySelectorAll<HTMLElement>(".reveal");
  if (!targets.length) return;

  if (prefersReducedMotion) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

function easeOutQuad(t: number) {
  return t * (2 - t);
}

function initCountUp() {
  const targets = document.querySelectorAll<HTMLElement>("[data-count-to]");
  if (!targets.length) return;

  const animate = (el: HTMLElement) => {
    const to = Number(el.dataset.countTo);
    if (!Number.isFinite(to)) return;
    const prefix = el.dataset.countPrefix ?? "";
    const suffix = el.dataset.countSuffix ?? "";
    const duration = 1100;

    if (prefersReducedMotion) {
      el.textContent = `${prefix}${to.toLocaleString("en-US")}${suffix}`;
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.round(to * easeOutQuad(progress));
      el.textContent = `${prefix}${value.toLocaleString("en-US")}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (prefersReducedMotion) {
    targets.forEach(animate);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          animate(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.4 }
  );

  targets.forEach((el) => observer.observe(el));
}

function init() {
  // Each initializer is isolated: if one throws (unexpected DOM shape on some
  // page), it must not leave .reveal content stuck at opacity:0 elsewhere.
  try {
    initScrollReveal();
  } catch {
    document.querySelectorAll<HTMLElement>(".reveal").forEach((el) => el.classList.add("is-visible"));
  }
  try {
    initCountUp();
  } catch {
    document.querySelectorAll<HTMLElement>("[data-count-to]").forEach((el) => {
      const to = Number(el.dataset.countTo);
      if (Number.isFinite(to)) {
        el.textContent = `${el.dataset.countPrefix ?? ""}${to.toLocaleString("en-US")}${el.dataset.countSuffix ?? ""}`;
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
