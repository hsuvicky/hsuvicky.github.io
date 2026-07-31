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
    const fadeWidth = Math.min(210, Math.max(90, viewportRect.width * 0.18));
    const leftEdge = labelsRect ? labelsRect.right + 12 : viewportRect.left;
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

function setupBlob() {
  const blob = document.querySelector("[data-blob]");
  const body = blob?.querySelector("[data-blob-body]");
  const path = blob?.querySelector("[data-blob-path]");
  if (!blob || !body || !path) return;

  const VB_W = 100;
  const VB_H = 64;
  const RX = 50;
  const RY = 60;
  const SEGMENTS = 36;
  const spring = reducedMotion.matches
    ? { stiffness: 1, damping: 1 }
    : { stiffness: 0.065, damping: 0.8 };

  const ARM_INTERVAL_MS = 30000;
  const ARM_WAVE_MS = reducedMotion.matches ? 80 : 1400;
  const ARM_TUCK_MS = reducedMotion.matches ? 80 : 480;

  let pointerX = window.innerWidth * 0.5;
  let pointerY = window.innerHeight * 0.35;
  let regenerateTimer = 0;
  let stateTimer = 0;
  let armTimer = 0;
  let armPhaseTimer = 0;
  let armState = "hidden";
  let squintOn = false;
  const eyeSmooth = { lx: 32, ly: 38, rx: 68, ry: 38 };

  const morph = {
    squash: 0,
    dent: 0,
    contactAng: Math.PI / 2,
    vSquash: 0,
    vDent: 0,
    vContactAng: 0,
  };

  function setState(state) {
    blob.dataset.state = state;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerpAngle(from, to, t) {
    let diff = to - from;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return from + diff * t;
  }

  function springTo(key, target) {
    const velocityKey = `v${key[0].toUpperCase()}${key.slice(1)}`;
    const force = (target - morph[key]) * spring.stiffness;
    morph[velocityKey] = (morph[velocityKey] + force) * spring.damping;
    morph[key] += morph[velocityKey];

    if (Math.abs(morph[velocityKey]) < 0.00035 && Math.abs(target - morph[key]) < 0.0007) {
      morph[key] = target;
      morph[velocityKey] = 0;
    }
  }

  function restPoint(theta) {
    return {
      x: VB_W / 2 + RX * Math.cos(theta),
      y: VB_H - RY * Math.sin(theta),
      theta,
    };
  }

  function deformPoint(theta) {
    // Base corners always stay on the nav line.
    if (theta <= 0.001) return { x: VB_W, y: VB_H, theta: 0 };
    if (theta >= Math.PI - 0.001) return { x: 0, y: VB_H, theta: Math.PI };

    let { x, y } = restPoint(theta);

    // Soft squat: compress toward the pinned base, but only about halfway max.
    const squash = morph.squash;
    if (squash > 0.001) {
      const height = VB_H - y;
      y = VB_H - height * (1 - squash * 0.48);
      const bulge = 1 + squash * 0.22 * Math.sin(theta);
      x = VB_W / 2 + (x - VB_W / 2) * bulge;
    }

    // Soft concave dent: yield inward around the poke, like pressing into jello.
    const dent = morph.dent;
    if (dent > 0.001) {
      let dAng = theta - morph.contactAng;
      while (dAng > Math.PI) dAng -= Math.PI * 2;
      while (dAng < -Math.PI) dAng += Math.PI * 2;
      const falloff = Math.exp(-((dAng / 0.72) ** 2));
      const nx = VB_W / 2 - x;
      const ny = VB_H - y;
      const len = Math.hypot(nx, ny) || 1;
      const depth = dent * 24 * falloff;
      x += (nx / len) * depth;
      y += (ny / len) * depth * 0.92;
    }

    y = Math.min(y, VB_H - 0.2);
    return { x, y, theta };
  }

  // Pull a surface point inward so eyes sit inside the deformed body.
  function eyePoint(theta, inset) {
    const surface = deformPoint(theta);
    const cx = VB_W / 2;
    const cy = VB_H;
    return {
      x: surface.x + (cx - surface.x) * inset,
      y: surface.y + (cy - surface.y) * inset,
      theta,
    };
  }

  function buildPath() {
    const pts = [];
    for (let i = 0; i <= SEGMENTS; i += 1) {
      const theta = Math.PI * (1 - i / SEGMENTS);
      pts.push(deformPoint(theta));
    }

    pts[0] = { x: 0, y: VB_H, theta: Math.PI };
    pts[pts.length - 1] = { x: VB_W, y: VB_H, theta: 0 };

    let d = `M${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 1; i < pts.length; i += 1) {
      d += `L${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
    }
    return `${d}Z`;
  }

  function morphTargets() {
    const rect = body.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) {
      return { squash: 0, dent: 0, contactAng: morph.contactAng };
    }

    const lx = (pointerX - rect.left) / rect.width;
    const ly = (pointerY - rect.top) / rect.height;
    const px = lx * VB_W;
    const py = ly * VB_H;

    // Far from the blob: no force.
    if (lx < -0.7 || lx > 1.7 || ly < -0.9 || ly > 1.55) {
      return { squash: 0, dent: 0, contactAng: morph.contactAng };
    }

    let ang = Math.atan2(VB_H - py, px - VB_W / 2);
    ang = clamp(ang, 0.08, Math.PI - 0.08);

    const surface = restPoint(ang);
    const cursorR = Math.hypot(px - VB_W / 2, py - VB_H);
    const surfaceR = Math.hypot(surface.x - VB_W / 2, surface.y - VB_H);
    // + outside the skin, - inside the body (finger pressing into jello).
    const outside = (cursorR - surfaceR) / RX;

    if (outside > 1.05) {
      return { squash: 0, dent: 0, contactAng: morph.contactAng };
    }

    // Inside the body still counts as contact — that's a press into the face/eyes.
    const approach = outside > 0 ? clamp(1 - outside / 1.05, 0, 1) : 1;
    const penetration = outside < 0 ? clamp(-outside, 0, 1.25) : 0;
    const pressure = clamp(approach * 0.48 + penetration * 1.05, 0, 1.3);

    const topness = Math.pow(Math.sin(ang), 1.25);

    // Primary response: local concave dent wherever you poke (including eye center).
    // Extra squash when the poke is on/near the crown — capped so it never
    // flattens all the way down to the nav line.
    return {
      squash: clamp(pressure * topness * 0.55, 0, 0.5),
      dent: pressure * 1.1,
      contactAng: ang,
    };
  }

  function placeEyes() {
    if (blob.dataset.state !== "idle") return;

    const rect = body.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;

    const localX = (pointerX - rect.left) / rect.width;
    const localY = (pointerY - rect.top) / rect.height;
    const onBlob =
      localX >= -0.08 &&
      localX <= 1.08 &&
      localY >= -0.2 &&
      localY <= 1.15;

    // Socket anchors follow the deformed body (including squash). Shared Y keeps
    // the pair level; gap keeps > < from touching.
    const inset = clamp(0.4 + morph.squash * 0.06 + morph.dent * 0.08, 0.38, 0.52);
    const halfSep = 0.42;
    const socketL = eyePoint(Math.PI / 2 + halfSep, inset);
    const socketR = eyePoint(Math.PI / 2 - halfSep, inset);
    const socketY = (socketL.y + socketR.y) / 2;
    const socketMidX = (socketL.x + socketR.x) / 2;
    const apex = deformPoint(Math.PI / 2);

    const lookGain = onBlob ? 7 : 4.5;
    const lookX = clamp((localX - 0.5) * lookGain * 2, -7, 7);
    // When squashed, don't let upward look fight the compressed body (floating eyes).
    const lookY =
      clamp((localY - 0.42) * lookGain * 1.2, -5.5, 5.5) * (1 - morph.squash * 1.35);

    const minGap = 36;
    let centerX = socketMidX + lookX * (1 - morph.squash * 0.35);
    let eyeY = socketY + lookY;

    // Clamp to the *current* squashed crown, not the resting silhouette.
    const minEyeY = apex.y + 7;
    const maxEyeY = VB_H - 11;
    centerX = clamp(centerX, 32, 68);
    eyeY = clamp(eyeY, minEyeY, maxEyeY);

    let leftX = centerX - minGap / 2;
    let rightX = centerX + minGap / 2;

    if (leftX < 16) {
      const shift = 16 - leftX;
      leftX += shift;
      rightX += shift;
    }
    if (rightX > 84) {
      const shift = rightX - 84;
      leftX -= shift;
      rightX -= shift;
    }
    if (rightX - leftX < minGap) {
      leftX = VB_W / 2 - minGap / 2;
      rightX = VB_W / 2 + minGap / 2;
    }

    // Ease eye motion so small morph/look jitter doesn't spazz the pupils.
    const ease = reducedMotion.matches ? 1 : 0.16;
    eyeSmooth.lx += (leftX - eyeSmooth.lx) * ease;
    eyeSmooth.ly += (eyeY - eyeSmooth.ly) * ease;
    eyeSmooth.rx += (rightX - eyeSmooth.rx) * ease;
    eyeSmooth.ry += (eyeY - eyeSmooth.ry) * ease;

    blob.style.setProperty("--eye-l-x", `${((eyeSmooth.lx / VB_W) * 100).toFixed(2)}%`);
    blob.style.setProperty("--eye-l-y", `${((eyeSmooth.ly / VB_H) * 100).toFixed(2)}%`);
    blob.style.setProperty("--eye-r-x", `${((eyeSmooth.rx / VB_W) * 100).toFixed(2)}%`);
    blob.style.setProperty("--eye-r-y", `${((eyeSmooth.ry / VB_H) * 100).toFixed(2)}%`);
    blob.style.setProperty(
      "--squint-y",
      `${((((eyeSmooth.ly + eyeSmooth.ry) / 2) / VB_H) * 100).toFixed(2)}%`,
    );

    const facePress = morph.dent > (squintOn ? 0.18 : 0.3) && Math.sin(morph.contactAng) > 0.72;
    const wantSquint = morph.squash > (squintOn ? 0.12 : 0.22) || facePress;
    squintOn = wantSquint;
    blob.dataset.squint = squintOn ? "true" : "false";
  }

  function renderMorph() {
    path.setAttribute("d", buildPath());
  }

  function setArmState(state) {
    armState = state;
    blob.dataset.arm = state;
  }

  function clearArmPhase() {
    window.clearTimeout(armPhaseTimer);
    armPhaseTimer = 0;
  }

  function scheduleArmWave() {
    window.clearTimeout(armTimer);
    if (reducedMotion.matches) return;
    armTimer = window.setTimeout(startArmWave, ARM_INTERVAL_MS);
  }

  function finishArmHide() {
    setArmState("hidden");
    scheduleArmWave();
  }

  function tuckArm() {
    if (armState === "hidden" || armState === "tucking") return;
    clearArmPhase();
    setArmState("tucking");
    armPhaseTimer = window.setTimeout(finishArmHide, ARM_TUCK_MS);
  }

  function startArmWave() {
    if (blob.dataset.state !== "idle") {
      scheduleArmWave();
      return;
    }

    clearArmPhase();
    setArmState("waving");
    armPhaseTimer = window.setTimeout(tuckArm, ARM_WAVE_MS);
  }

  function tick() {
    const active = blob.dataset.state === "idle";
    const targets = active
      ? morphTargets()
      : { squash: 0, dent: 0, contactAng: morph.contactAng };

    springTo("squash", targets.squash);
    springTo("dent", targets.dent);

    // Ease contact angle toward the poke point for a traveling concave.
    if (active && targets.dent + targets.squash > 0.02) {
      morph.contactAng = lerpAngle(morph.contactAng, targets.contactAng, 0.1);
    }

    // If poked while waving, stash the arm behind the body.
    if (active && armState === "waving" && (morph.dent > 0.12 || morph.squash > 0.12)) {
      tuckArm();
    }

    renderMorph();
    if (active) placeEyes();
    else if (blob.dataset.state === "rising") blob.dataset.squint = "true";

    requestAnimationFrame(tick);
  }

  function clearTimers() {
    window.clearTimeout(regenerateTimer);
    window.clearTimeout(stateTimer);
    clearArmPhase();
  }

  function finishRise() {
    setState("idle");
    blob.dataset.squint = "false";
    blob.setAttribute("aria-label", "Friendly blob. Click to pop.");
    scheduleArmWave();
  }

  function startRise() {
    setState("rising");
    blob.dataset.squint = "true";
    blob.setAttribute("aria-label", "Blob is coming back.");
    morph.squash = 0;
    morph.dent = 0;
    morph.vSquash = 0;
    morph.vDent = 0;
    morph.contactAng = Math.PI / 2;
    renderMorph();
    const riseMs = reducedMotion.matches ? 80 : 1350;
    stateTimer = window.setTimeout(finishRise, riseMs);
  }

  function popBlob() {
    if (blob.dataset.state !== "idle") return;

    clearTimers();
    window.clearTimeout(armTimer);
    setArmState("hidden");
    setState("popping");
    blob.dataset.squint = "false";
    blob.setAttribute("aria-label", "Blob popped.");

    const popMs = reducedMotion.matches ? 80 : 420;
    stateTimer = window.setTimeout(() => {
      setState("gone");
      regenerateTimer = window.setTimeout(startRise, reducedMotion.matches ? 900 : 2600);
    }, popMs);
  }

  function onPointer(event) {
    pointerX = event.clientX;
    pointerY = event.clientY;
  }

  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("mousemove", onPointer, { passive: true });

  blob.addEventListener("click", (event) => {
    event.preventDefault();
    popBlob();
  });

  blob.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      popBlob();
    }
  });

  renderMorph();
  placeEyes();
  setArmState("hidden");
  // First wave soon after load, then every 30s after each tuck.
  if (!reducedMotion.matches) {
    armTimer = window.setTimeout(startArmWave, 2500);
  }
  requestAnimationFrame(tick);
}

setupBlob();
