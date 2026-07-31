const root = document.documentElement;
const themeToggle = document.querySelector(".theme-toggle");
const themeColor = document.querySelector("#theme-color");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const homeLink = document.querySelector('.nav-links a[href="/"]');
const isHomePage = Boolean(document.querySelector("[data-career-timeline]"));
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
  homeLink?.removeAttribute("aria-current");

  sectionLinks.forEach((link) => {
    const active = link.getAttribute("href") === `#${id}`;
    if (active) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function markHomeActive() {
  if (!isHomePage) return;
  sectionLinks.forEach((link) => link.removeAttribute("aria-current"));
  homeLink?.setAttribute("aria-current", "page");
}

let activeSectionFrame;

function updateActiveSection() {
  const marker = window.innerHeight * 0.38;
  let current;

  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= marker) current = section;
  });

  if (current) {
    markActiveSection(current.id);
  } else {
    markHomeActive();
  }
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

function setupCareerTimeline() {
  const timeline = document.querySelector("[data-career-timeline]");
  const viewport = timeline?.querySelector("[data-timeline-viewport]");
  const hobbiesToggle = document.querySelector("[data-timeline-hobbies-toggle]");
  const hobbyContents = timeline ? [...timeline.querySelectorAll("[data-hobby-content]")] : [];
  const cards = viewport ? [...viewport.querySelectorAll(".progression-rail > li")] : [];

  if (!viewport || !cards.length) return;

  let fadeFrame;
  let autoScrollFrame;
  let autoScrolling = false;
  let dragging = false;
  let dragStartX = 0;
  let dragStartScroll = 0;

  function stopAutoScroll() {
    autoScrolling = false;
    if (autoScrollFrame) cancelAnimationFrame(autoScrollFrame);
    autoScrollFrame = null;
  }

  function updateCardFades() {
    const viewportRect = viewport.getBoundingClientRect();
    const labelsRect = timeline.querySelector(".timeline-labels")?.getBoundingClientRect();
    const fadeWidth = Math.min(210, Math.max(70, viewportRect.width * 0.18));
    const hasLabels = Boolean(labelsRect?.width);
    const leftEdge = hasLabels ? labelsRect.right + 12 : viewportRect.left + 8;
    const rightEdge = viewportRect.right - Math.min(40, viewportRect.width * 0.04);
    const atStart = viewport.scrollLeft <= 1;
    const atEnd = viewport.scrollLeft >= viewport.scrollWidth - viewport.clientWidth - 1;

    cards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const leftOpacity = atStart ? 1 : (cardRect.left - leftEdge) / fadeWidth;
      const rightOpacity = atEnd ? 1 : (rightEdge - cardRect.left) / fadeWidth;
      const opacity = Math.max(0, Math.min(1, leftOpacity, rightOpacity));
      card.style.opacity = reducedMotion.matches ? "1" : opacity.toFixed(3);
    });
  }

  function requestFadeUpdate() {
    if (fadeFrame) return;
    fadeFrame = requestAnimationFrame(() => {
      updateCardFades();
      fadeFrame = null;
    });
  }

  viewport.addEventListener("scroll", requestFadeUpdate, { passive: true });
  window.addEventListener("resize", () => {
    stopAutoScroll();
    requestFadeUpdate();
  });

  hobbiesToggle?.addEventListener("click", () => {
    stopAutoScroll();
    const showHobbies = timeline.dataset.hobbiesVisible !== "true";

    timeline.dataset.hobbiesVisible = String(showHobbies);
    hobbiesToggle.textContent = showHobbies ? "Hide hobbies" : "Show hobbies";
    hobbiesToggle.setAttribute("aria-expanded", String(showHobbies));
    hobbyContents.forEach((content) => content.setAttribute("aria-hidden", String(!showHobbies)));
    requestFadeUpdate();
  });

  viewport.addEventListener(
    "wheel",
    (event) => {
      stopAutoScroll();
      if (!event.shiftKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      viewport.scrollLeft += event.deltaY;
    },
    { passive: false },
  );

  viewport.addEventListener("pointerdown", (event) => {
    stopAutoScroll();
    if (event.pointerType === "touch") return;
    dragging = true;
    dragStartX = event.clientX;
    dragStartScroll = viewport.scrollLeft;
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    viewport.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
  });

  function stopDragging(event) {
    if (!dragging) return;
    dragging = false;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
  }

  viewport.addEventListener("pointerup", stopDragging);
  viewport.addEventListener("pointercancel", stopDragging);

  viewport.addEventListener("keydown", (event) => {
    stopAutoScroll();
    const distance = Math.max(180, viewport.clientWidth * 0.38);
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      viewport.scrollBy({
        left: event.key === "ArrowLeft" ? -distance : distance,
        behavior: reducedMotion.matches ? "auto" : "smooth",
      });
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      viewport.scrollTo({
        left: event.key === "Home" ? 0 : viewport.scrollWidth,
        behavior: reducedMotion.matches ? "auto" : "smooth",
      });
    }
  });

  function startTimelineIntro() {
    requestAnimationFrame(() => {
      const targetDistance = viewport.scrollWidth - viewport.clientWidth;
      viewport.scrollLeft = 0;
      updateCardFades();

      if (reducedMotion.matches || targetDistance <= 1) {
        viewport.scrollLeft = targetDistance;
        updateCardFades();
        return;
      }

      const duration = Math.min(4200, Math.max(3000, targetDistance * 1.8));
      let startTime;
      autoScrolling = true;

      function step(timestamp) {
        if (!autoScrolling) return;
        if (startTime === undefined) startTime = timestamp;

        const progress = Math.min(1, (timestamp - startTime) / duration);
        const acceleratedProgress = progress * progress;
        viewport.scrollLeft = targetDistance * acceleratedProgress;
        updateCardFades();

        if (progress < 1) {
          autoScrollFrame = requestAnimationFrame(step);
        } else {
          viewport.scrollLeft = targetDistance;
          autoScrolling = false;
          autoScrollFrame = null;
          updateCardFades();
        }
      }

      autoScrollFrame = requestAnimationFrame(step);
    });
  }

  startTimelineIntro();
}

setupCareerTimeline();
