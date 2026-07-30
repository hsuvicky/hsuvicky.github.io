const root = document.documentElement;
const themeToggle = document.querySelector(".theme-toggle");
const themeColor = document.querySelector("#theme-color");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const sectionLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const sections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function getSavedTheme() {
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
}

function applyTheme(theme, persist = false) {
  const isDark = theme === "dark";
  root.dataset.theme = isDark ? "dark" : "light";
  themeToggle?.setAttribute("aria-pressed", String(isDark));
  themeToggle?.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
  themeColor?.setAttribute("content", isDark ? "#0f1720" : "#f2f0ef");

  if (persist) {
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {
      // The selected theme still applies for this visit if storage is unavailable.
    }
  }
}

applyTheme(root.dataset.theme || (colorScheme.matches ? "dark" : "light"));

themeToggle?.addEventListener("click", () => {
  applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
});

colorScheme.addEventListener("change", (event) => {
  if (!getSavedTheme()) {
    applyTheme(event.matches ? "dark" : "light");
  }
});

function setMenu(open) {
  if (!navToggle || !navLinks) return;
  navToggle.setAttribute("aria-expanded", String(open));
  navLinks.dataset.open = String(open);
  navToggle.querySelector(".nav-toggle-label").textContent = open ? "Close" : "Menu";
}

navToggle?.addEventListener("click", () => {
  setMenu(navToggle.getAttribute("aria-expanded") !== "true");
});

navLinks?.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navToggle?.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    navToggle.focus();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) setMenu(false);
});

function markActiveSection(id) {
  sectionLinks.forEach((link) => {
    const active = link.getAttribute("href") === `#${id}`;
    if (active) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

let activeSectionFrame;

function updateActiveSection() {
  const marker = window.innerHeight * 0.38;
  let current = sections[0];

  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= marker) current = section;
  });

  if (current) markActiveSection(current.id);
}

function requestActiveSectionUpdate() {
  if (activeSectionFrame) return;
  activeSectionFrame = requestAnimationFrame(() => {
    updateActiveSection();
    activeSectionFrame = null;
  });
}

window.addEventListener("scroll", requestActiveSectionUpdate, { passive: true });
window.addEventListener("resize", requestActiveSectionUpdate);

window.addEventListener("hashchange", () => {
  const id = window.location.hash.slice(1);
  if (sections.some((section) => section.id === id)) markActiveSection(id);
});

const initialSection = window.location.hash.slice(1);
if (sections.some((section) => section.id === initialSection)) {
  markActiveSection(initialSection);
} else {
  updateActiveSection();
}

function setupScrollReveals() {
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;

  const revealGroups = [
    [".section-heading", 0],
    [".progression-rail li", 55],
    [".case-study", 0],
    [".enterprise-folio > *", 55],
    [".field-note", 55],
  ];
  const revealTargets = [];

  revealGroups.forEach(([selector, stagger]) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      element.classList.add("reveal-item");
      element.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * stagger}ms`);
      revealTargets.push(element);
    });
  });

  if (!revealTargets.length) return;

  let lastScrollPosition = window.scrollY;
  let scrollDirection = "down";

  window.addEventListener(
    "scroll",
    () => {
      const nextScrollPosition = window.scrollY;
      if (Math.abs(nextScrollPosition - lastScrollPosition) > 3) {
        scrollDirection = nextScrollPosition > lastScrollPosition ? "down" : "up";
        lastScrollPosition = nextScrollPosition;
      }
    },
    { passive: true },
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.dataset.revealFrom = scrollDirection === "down" ? "top" : "bottom";
          requestAnimationFrame(() => entry.target.classList.add("is-revealed"));
          return;
        }

        if (
          entry.boundingClientRect.bottom <= 0 ||
          entry.boundingClientRect.top >= window.innerHeight
        ) {
          entry.target.classList.remove("is-revealed");
        }
      });
    },
    {
      rootMargin: "0px 0px -9% 0px",
      threshold: 0.08,
    },
  );

  document.documentElement.classList.add("reveal-ready");
  revealTargets.forEach((element) => observer.observe(element));
}

setupScrollReveals();
